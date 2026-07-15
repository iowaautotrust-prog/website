// Supabase Edge Function: cloudinary-upload-signature
// Mints a short-lived signed-upload payload so the admin panel can upload
// vehicle photos straight to Cloudinary's free tier without exposing the
// Cloudinary API secret to the browser.
// Requires secrets set via:
//   supabase secrets set CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY")!;
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET")!;
const UPLOAD_FOLDER = "vehicle-images";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sha1Hex = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_manager")
      .eq("id", userData.user.id)
      .single();

    const isAdmin = profile?.is_admin === true || profile?.is_manager === true;
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Cloudinary signature = SHA1 of every param that will be uploaded
    // (except file/api_key/cloud_name), sorted alphabetically, with the
    // API secret appended directly. Only "folder" + "timestamp" here.
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sha1Hex(
      `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
    );

    return new Response(
      JSON.stringify({
        timestamp,
        signature,
        apiKey: CLOUDINARY_API_KEY,
        cloudName: CLOUDINARY_CLOUD_NAME,
        folder: UPLOAD_FOLDER,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cloudinary-upload-signature error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
