// Supabase Edge Function: admin-users
// Powers Admin -> Users. Browsers are not allowed to read other people's email addresses or delete accounts
// directly, so these actions run here with the service key, after checking that the caller is an admin.
//
// POST { action, ... }
//   list                                  -> every account with email, role, last sign-in, disabled flag, counts
//   set_role   { id, role }               role: "admin" | "manager" | "user"
//   set_profile{ id, name, phone }
//   set_disabled { id, disabled }         a disabled account cannot sign in (nothing is deleted)
//   send_reset { id }                     emails the person a "set a new password" link
//   create     { email, name, password, role }   creates a confirmed account (the admin hands over the password)
//   delete     { id }                     permanently deletes the account
//
// Safety rules enforced here (not just in the page): you cannot change, disable or delete your OWN account,
// and the last admin can never be demoted, disabled or deleted.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// Optional secret: SITE_URL (default https://iowatrustmotors.com), used in the password reset link.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://iowatrustmotors.com").replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class Refuse extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Refuse("Supabase environment is not available.", 500);

    // Who is calling? Must be a signed-in admin.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw new Refuse("Please sign in again.", 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) throw new Refuse("Please sign in again.", 401);
    const me = userData.user.id;

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: myProfile } = await db.from("profiles").select("is_admin").eq("id", me).maybeSingle();
    if (!myProfile?.is_admin) throw new Refuse("Only admins can manage users.", 403);

    const input = await req.json();
    const action = String(input?.action ?? "");

    const adminCount = async (): Promise<number> => {
      const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", true);
      return count ?? 0;
    };
    const targetOf = async (id: unknown) => {
      if (typeof id !== "string" || !id) throw new Refuse("Missing user.");
      const { data: p } = await db.from("profiles").select("id,is_admin,is_manager,name").eq("id", id).maybeSingle();
      const { data: a } = await db.auth.admin.getUserById(id);
      if (!a?.user) throw new Refuse("That user no longer exists.", 404);
      return { id, profile: p, auth: a.user };
    };
    const notMe = (id: string, what: string) => {
      if (id === me) throw new Refuse(`You cannot ${what} your own account. Ask another admin.`);
    };
    const keepOneAdmin = async (t: { profile: { is_admin?: boolean } | null }, what: string) => {
      if (t.profile?.is_admin && (await adminCount()) <= 1) throw new Refuse(`You cannot ${what} the last admin.`);
    };

    // ── list ─────────────────────────────────────────────────────────────────────────────────────
    if (action === "list") {
      // Everything below is independent, so it all runs at once instead of one round trip after another.
      const fetchAllUsers = async (): Promise<Array<Record<string, unknown>>> => {
        const perPage = 1000;
        const first = await db.auth.admin.listUsers({ page: 1, perPage });
        if (first.error) throw new Refuse(first.error.message, 500);
        const users: Array<Record<string, unknown>> = [...(first.data?.users ?? [])];
        let lastPage = Math.min((first.data as { lastPage?: number } | null)?.lastPage ?? 0, 10);
        // No page info but a full first page: assume more exist (pages past the end just come back empty).
        if (!lastPage && users.length >= perPage) lastPage = 10;
        if (lastPage > 1) {
          const rest = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, i) => db.auth.admin.listUsers({ page: i + 2, perPage }))
          );
          for (const r of rest) {
            if (r.error) throw new Refuse(r.error.message, 500);
            users.push(...(r.data?.users ?? []));
          }
        }
        return users;
      };
      const [users, { data: profiles }, { data: favs }, { data: leads }] = await Promise.all([
        fetchAllUsers(),
        db.from("profiles").select("id,name,phone,is_admin,is_manager,created_at"),
        db.from("favorites").select("user_id").not("user_id", "is", null),
        db.from("leads").select("user_id").not("user_id", "is", null),
      ]);
      const byProfile = new Map((profiles ?? []).map((p: { id: string }) => [p.id, p]));
      const count = (rows: { user_id: string | null }[] | null) => {
        const m = new Map<string, number>();
        (rows ?? []).forEach((r) => r.user_id && m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1));
        return m;
      };
      const favCount = count(favs);
      const leadCount = count(leads);
      const now = Date.now();
      const out = (users as Array<Record<string, unknown>>).map((u: any) => {
        const p: any = byProfile.get(u.id) ?? {};
        return {
          id: u.id,
          email: u.email ?? "",
          name: p.name ?? u.user_metadata?.full_name ?? null,
          phone: p.phone ?? null,
          is_admin: p.is_admin === true,
          is_manager: p.is_manager === true,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          disabled: !!u.banned_until && new Date(u.banned_until).getTime() > now,
          confirmed: !!(u.email_confirmed_at || u.confirmed_at),
          favorites_count: favCount.get(u.id) ?? 0,
          leads_count: leadCount.get(u.id) ?? 0,
        };
      });
      out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return reply(200, { users: out, me });
    }

    // ── set_role ─────────────────────────────────────────────────────────────────────────────────
    if (action === "set_role") {
      const role = String(input.role ?? "");
      if (!["admin", "manager", "user"].includes(role)) throw new Refuse("Unknown role.");
      const t = await targetOf(input.id);
      notMe(t.id, "change the role of");
      if (role !== "admin") await keepOneAdmin(t, "remove admin from");
      const { error } = await db
        .from("profiles")
        .upsert({ id: t.id, is_admin: role === "admin", is_manager: role === "manager" }, { onConflict: "id" });
      if (error) throw new Refuse(error.message, 500);
      return reply(200, { success: true });
    }

    // ── set_profile ──────────────────────────────────────────────────────────────────────────────
    if (action === "set_profile") {
      const t = await targetOf(input.id);
      const name = String(input.name ?? "").trim().slice(0, 120) || null;
      const phone = String(input.phone ?? "").trim().slice(0, 40) || null;
      const { error } = await db.from("profiles").upsert({ id: t.id, name, phone }, { onConflict: "id" });
      if (error) throw new Refuse(error.message, 500);
      return reply(200, { success: true });
    }

    // ── set_disabled ─────────────────────────────────────────────────────────────────────────────
    if (action === "set_disabled") {
      const disabled = input.disabled === true;
      const t = await targetOf(input.id);
      if (disabled) {
        notMe(t.id, "disable");
        await keepOneAdmin(t, "disable");
      }
      const { error } = await db.auth.admin.updateUserById(t.id, { ban_duration: disabled ? "876000h" : "none" });
      if (error) throw new Refuse(error.message, 500);
      return reply(200, { success: true });
    }

    // ── send_reset ───────────────────────────────────────────────────────────────────────────────
    if (action === "send_reset") {
      const t = await targetOf(input.id);
      if (!t.auth.email) throw new Refuse("This account has no email address.");
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const { error } = await anon.auth.resetPasswordForEmail(t.auth.email, {
        redirectTo: `${SITE_URL}/auth/callback?type=recovery`,
      });
      if (error) throw new Refuse(error.message, 502);
      return reply(200, { success: true, email: t.auth.email });
    }

    // ── create ───────────────────────────────────────────────────────────────────────────────────
    if (action === "create") {
      const email = String(input.email ?? "").trim().toLowerCase();
      const password = String(input.password ?? "");
      const name = String(input.name ?? "").trim().slice(0, 120);
      const role = String(input.role ?? "user");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Refuse("Enter a valid email address.");
      if (password.length < 8) throw new Refuse("The password must be at least 8 characters.");
      if (!["admin", "manager", "user"].includes(role)) throw new Refuse("Unknown role.");
      const { data, error } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error || !data?.user) throw new Refuse(error?.message ?? "Could not create the account.", 400);
      const { error: pErr } = await db
        .from("profiles")
        .upsert({ id: data.user.id, name: name || null, is_admin: role === "admin", is_manager: role === "manager" }, { onConflict: "id" });
      if (pErr) throw new Refuse(`Account created, but its role could not be saved: ${pErr.message}`, 500);
      return reply(200, { success: true, id: data.user.id });
    }

    // ── delete ───────────────────────────────────────────────────────────────────────────────────
    if (action === "delete") {
      const t = await targetOf(input.id);
      notMe(t.id, "delete");
      await keepOneAdmin(t, "delete");
      const { error } = await db.auth.admin.deleteUser(t.id);
      if (error) throw new Refuse(error.message, 500);
      return reply(200, { success: true });
    }

    throw new Refuse("Unknown action.");
  } catch (err) {
    if (err instanceof Refuse) return reply(err.status, { error: err.message });
    console.error("admin-users error:", err);
    return reply(500, { error: String(err) });
  }
});
