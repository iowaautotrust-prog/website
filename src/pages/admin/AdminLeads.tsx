import { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { query } from "@/lib/query";
import type { Lead, LeadReply, LeadStatus } from "@/lib/types";
import {
  ArrowLeft, Loader2, MessageSquare, Phone, MessageCircle, Mail, Reply, Trash2, Search, Send, X, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/siteConfig";
import { functionError } from "@/lib/functionError";

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-900",
  closed: "bg-green-100 text-green-800",
  spam: "bg-red-100 text-red-800",
};

const digits = (phone: string) => phone.replace(/[^\d+]/g, "");
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

const AdminLeads = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDemoModeReady } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [replies, setReplies] = useState<Record<string, LeadReply[]>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesState, setNotesState] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isDemoModeReady || !user?.isAdmin) return;
    (async () => {
      try {
        const { data } = await query(() =>
          supabase.from("leads").select("*").order("created_at", { ascending: false })
        );
        const rows = (data as Lead[]) ?? [];
        setLeads(rows);
        setNotes(Object.fromEntries(rows.map((l) => [l.id, l.internal_notes ?? ""])));
        // Reply history: if the database update has not been run yet this simply stays empty.
        const { data: reps } = await supabase.from("lead_replies").select("*").order("created_at", { ascending: true });
        const byLead: Record<string, LeadReply[]> = {};
        ((reps as LeadReply[]) ?? []).forEach((r) => (byLead[r.lead_id] ??= []).push(r));
        setReplies(byLead);
      } catch {
        /* the empty state below explains it */
      } finally {
        setLoading(false);
      }
    })();
  }, [isDemoModeReady, user?.isAdmin]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length, new: 0, contacted: 0, closed: 0, spam: 0 };
    leads.forEach((l) => (c[l.status] = (c[l.status] ?? 0) + 1));
    return c;
  }, [leads]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.vehicle_name, l.message].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [leads, statusFilter, search]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user?.isAdmin) return <Navigate to="/login" />;

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice((n) => (n === msg ? null : n)), 4000);
  };

  const updateStatus = async (ids: string[], status: LeadStatus) => {
    const { error } = await supabase.from("leads").update({ status }).in("id", ids);
    if (error) {
      flash(/leads_status_check|violates check/i.test(error.message)
        ? "The database update for the new statuses has not been run yet (see the setup guide)."
        : `Could not change the status: ${error.message}`);
      return;
    }
    setLeads((ls) => ls.map((l) => (ids.includes(l.id) ? { ...l, status } : l)));
  };

  const saveNotes = async (id: string) => {
    const lead = leads.find((l) => l.id === id);
    const text = notes[id] ?? "";
    if (!lead || (lead.internal_notes ?? "") === text) return;
    setNotesState((s) => ({ ...s, [id]: "saving" }));
    const { error } = await supabase.from("leads").update({ internal_notes: text.trim() || null }).eq("id", id);
    if (error) {
      setNotesState((s) => ({ ...s, [id]: "error" }));
      return;
    }
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, internal_notes: text.trim() || null } : l)));
    setNotesState((s) => ({ ...s, [id]: "saved" }));
    window.setTimeout(
      () =>
        setNotesState((s) => {
          if (s[id] !== "saved") return s;
          const rest = { ...s };
          delete rest[id];
          return rest;
        }),
      2500
    );
  };

  const openReply = (l: Lead) => {
    if (replyOpen === l.id) { setReplyOpen(null); return; }
    setReplyOpen(l.id);
    setReplyError(null);
    setReplyForm({
      subject: `Re: ${l.vehicle_name ? l.vehicle_name : "your inquiry"} - ${SITE.name}`,
      message: `Hi ${firstName(l.name)},\n\n\n\nThank you,\n${SITE.name}\n${SITE.phone}`,
    });
  };

  const sendReply = async (l: Lead) => {
    if (sending) return;
    setSending(true);
    setReplyError(null);
    const { data, error } = await supabase.functions.invoke("send-lead-reply", {
      body: { leadId: l.id, subject: replyForm.subject, message: replyForm.message },
    });
    setSending(false);
    if (error || data?.error) {
      setReplyError(
        error
          ? await functionError(error, "The reply service is not set up yet (the send-lead-reply function has not been deployed).")
          : String(data.error)
      );
      return;
    }
    if (data?.reply) setReplies((r) => ({ ...r, [l.id]: [...(r[l.id] ?? []), data.reply as LeadReply] }));
    if (l.status === "new") setLeads((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: "contacted" } : x)));
    setReplyOpen(null);
    flash(`Reply sent to ${l.email}.${data?.historySaved === false ? " (It could not be saved to the history.)" : ""}`);
  };

  const confirmDelete = async () => {
    if (!deleteIds) return;
    setDeleting(true);
    const { data, error } = await supabase.from("leads").delete().in("id", deleteIds).select("id");
    setDeleting(false);
    const gone = new Set((data ?? []).map((r: { id: string }) => r.id));
    if (error || gone.size === 0) {
      flash(error ? `Could not delete: ${error.message}` : "Nothing was deleted. The database update that allows deleting leads has not been run yet.");
      setDeleteIds(null);
      return;
    }
    setLeads((ls) => ls.filter((l) => !gone.has(l.id)));
    setSelected((s) => new Set([...s].filter((id) => !gone.has(id))));
    setDeleteIds(null);
    flash(`Deleted ${gone.size} lead${gone.size === 1 ? "" : "s"}.`);
  };

  const allVisibleSelected = visible.length > 0 && visible.every((l) => selected.has(l.id));
  const toggleAllVisible = () =>
    setSelected((s) => {
      const next = new Set(s);
      if (allVisibleSelected) visible.forEach((l) => next.delete(l.id));
      else visible.forEach((l) => next.add(l.id));
      return next;
    });

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="mb-6">
          <p className="text-overline mb-1">Admin</p>
          <h1 className="heading-section">Leads & Inquiries</h1>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Filter leads by status">
          {([{ value: "all", label: "All" }, ...STATUSES] as { value: "all" | LeadStatus; label: string }[]).map((s) => (
            <button
              key={s.value}
              role="tab"
              aria-selected={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === s.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary"
              }`}
            >
              {s.label} <span className="opacity-80">({counts[s.value] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, vehicle..." className="pl-9" />
        </div>

        {notice && (
          <div role="status" className="mb-4 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground">{notice}</div>
        )}

        {/* Bulk bar */}
        {visible.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label="Select all shown leads" />
              {selected.size > 0 ? `${selected.size} selected` : "Select all"}
            </label>
            {selected.size > 0 && (
              <>
                <button onClick={() => updateStatus([...selected], "contacted")} className="text-sm text-primary hover:underline">Mark contacted</button>
                <button onClick={() => updateStatus([...selected], "closed")} className="text-sm text-primary hover:underline">Mark closed</button>
                <button onClick={() => updateStatus([...selected], "spam")} className="text-sm text-primary hover:underline">Mark spam</button>
                <button
                  onClick={() => setDeleteIds([...selected])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive hover:underline"
                >
                  <Trash2 className="w-4 h-4" /> Delete selected
                </button>
                <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-muted-foreground hover:text-foreground">Clear</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="section-padding pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">{leads.length === 0 ? "No leads yet." : "No leads match this filter."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((l, i) => {
              const history = replies[l.id] ?? [];
              const open = replyOpen === l.id;
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * Math.min(i, 15) }}
                  className={`p-5 sm:p-6 rounded-xl border hover:shadow-sm transition-shadow ${
                    l.status === "new" ? "border-blue-300 bg-blue-50/40" : "border-border"
                  } ${l.status === "spam" ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Checkbox
                        checked={selected.has(l.id)}
                        onCheckedChange={() =>
                          setSelected((s) => {
                            const next = new Set(s);
                            if (next.has(l.id)) next.delete(l.id);
                            else next.add(l.id);
                            return next;
                          })
                        }
                        aria-label={`Select ${l.name}`}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-foreground">{l.name}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5 break-words">
                          <a href={`mailto:${l.email}`} className="hover:underline">{l.email}</a>
                          {l.phone && ` · ${l.phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 shrink-0">
                      <div className="sm:text-right">
                        {l.vehicle_name && <p className="text-sm font-medium text-primary">{l.vehicle_name}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
                        {l.lead_source && (
                          <p className="text-xs text-muted-foreground">
                            Source: <span className="font-medium text-foreground">{l.lead_source}</span>
                            {l.utm_campaign && ` · ${l.utm_campaign}`}
                          </p>
                        )}
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[l.status] ?? ""}`}>
                          {l.lead_type.replace("_", " ")} · {l.status}
                        </span>
                      </div>
                      <select
                        value={l.status}
                        onChange={(e) => updateStatus([l.id], e.target.value as LeadStatus)}
                        aria-label={`Status for ${l.name}`}
                        className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {l.message && (
                    <p className="text-sm text-foreground bg-secondary p-4 rounded-lg whitespace-pre-line break-words">{l.message}</p>
                  )}

                  {/* Quick actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button
                      onClick={() => openReply(l)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Reply className="w-4 h-4" /> Reply
                    </button>
                    {l.phone && (
                      <>
                        <a
                          href={`tel:${digits(l.phone)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                        >
                          <Phone className="w-4 h-4" /> Call
                        </a>
                        <a
                          href={`sms:${digits(l.phone)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                        >
                          <MessageCircle className="w-4 h-4" /> Text
                        </a>
                      </>
                    )}
                    <a
                      href={`mailto:${l.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                    >
                      <Mail className="w-4 h-4" /> Email app
                    </a>
                    <button
                      onClick={() => setDeleteIds([l.id])}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>

                  {/* Reply form */}
                  {open && (
                    <div className="mt-4 rounded-xl border border-primary/30 bg-background p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Reply to {l.name}</p>
                        <button onClick={() => setReplyOpen(null)} aria-label="Close reply" className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From <span className="font-medium text-foreground">{SITE.email}</span> to{" "}
                        <span className="font-medium text-foreground">{l.email}</span>. Their reply comes back to {SITE.email}.
                      </p>
                      <Input
                        value={replyForm.subject}
                        onChange={(e) => setReplyForm((f) => ({ ...f, subject: e.target.value }))}
                        aria-label="Subject"
                        placeholder="Subject"
                      />
                      <Textarea
                        value={replyForm.message}
                        onChange={(e) => setReplyForm((f) => ({ ...f, message: e.target.value }))}
                        aria-label="Message"
                        className="min-h-[170px]"
                      />
                      <div className="rounded-lg border-l-4 border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Their message is quoted below your reply:</p>
                        <p className="whitespace-pre-line line-clamp-4">{l.message || "(no message)"}</p>
                      </div>
                      {replyError && <p role="alert" className="text-sm text-destructive">{replyError}</p>}
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setReplyOpen(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
                        <button
                          onClick={() => sendReply(l)}
                          disabled={sending || !replyForm.subject.trim() || !replyForm.message.trim()}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* History of replies sent from here */}
                  {history.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Replies sent</p>
                      {history.map((r) => (
                        <div key={r.id} className="rounded-lg border border-border bg-background px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()} · to {r.sent_to} · <span className="font-medium text-foreground">{r.subject}</span>
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-line break-words">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Internal notes: never shown to the customer */}
                  <div className="mt-4">
                    <label htmlFor={`notes-${l.id}`} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Internal notes (private)
                      {notesState[l.id] === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
                      {notesState[l.id] === "saved" && <span className="inline-flex items-center gap-1 normal-case tracking-normal text-green-700"><Check className="w-3 h-3" /> Saved</span>}
                      {notesState[l.id] === "error" && <span className="normal-case tracking-normal text-destructive">Not saved: the database update has not been run yet</span>}
                    </label>
                    <Textarea
                      id={`notes-${l.id}`}
                      value={notes[l.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))}
                      onBlur={() => saveNotes(l.id)}
                      placeholder='e.g. "Called, coming Saturday."'
                      className="min-h-[60px]"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteIds !== null} onOpenChange={(o) => !o && !deleting && setDeleteIds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds && deleteIds.length > 1
                ? `This permanently deletes ${deleteIds.length} leads, with their notes and reply history. This cannot be undone.`
                : "This permanently deletes this lead, with its notes and reply history. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
};

export default AdminLeads;
