import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { REVIEWS_SETTING_KEY, loadReviews, type GoogleReview } from "@/lib/reviews";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Check, Plus, Trash2 } from "lucide-react";
import Footer from "@/components/Footer";

const AdminReviews = () => {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews().then((revs) => {
      setRows(revs);
      setLoading(false);
    });
  }, []);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user?.isAdmin) return <Navigate to="/login" />;

  const setRow = (i: number, patch: Partial<GoogleReview>) => {
    setSaved(false);
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => {
    setSaved(false);
    setRows((rs) => [...rs, { author: "", text: "", when: "" }]);
  };
  const removeRow = (i: number) => {
    setSaved(false);
    setRows((rs) => rs.filter((_, j) => j !== i));
  };

  const handleSave = async () => {
    setError(null);
    const cleaned = rows
      .map((r) => ({ author: r.author.trim(), text: r.text.trim(), when: r.when?.trim() || undefined }))
      .filter((r) => r.author || r.text);
    for (const r of cleaned) {
      if (!r.author || !r.text) {
        setError("Each review needs both a name and the review text — remove any half-filled rows.");
        return;
      }
    }
    setSaving(true);
    const { error: err } = await supabase
      .from("settings")
      .upsert(
        { key: REVIEWS_SETTING_KEY, value: JSON.stringify(cleaned), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setRows(cleaned);
    setSaved(true);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="mb-8">
          <p className="text-overline mb-1">Admin</p>
          <h1 className="heading-section">Google Reviews</h1>
          <p className="text-body mt-2 max-w-xl">
            Shown on the homepage. Only paste reviews that are really on the Google Business Profile,
            word for word, with the reviewer's name exactly as Google shows it. Leave this empty and
            the homepage simply shows a "Read our Google reviews" button instead.
          </p>
        </div>
      </div>

      <div className="section-padding pb-24 max-w-3xl">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <div className="space-y-5">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input value={r.author} onChange={(e) => setRow(i, { author: e.target.value })} placeholder="Reviewer name, e.g. Jane D." />
                    <Input value={r.when ?? ""} onChange={(e) => setRow(i, { when: e.target.value })} placeholder="When (optional), e.g. October 2026" />
                  </div>
                  <button onClick={() => removeRow(i)} className="shrink-0 p-2 rounded-lg text-destructive hover:bg-destructive/10" aria-label="Remove this review">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Textarea
                  value={r.text}
                  onChange={(e) => setRow(i, { text: e.target.value })}
                  placeholder="Paste the review text exactly as it appears on Google..."
                  className="min-h-[80px]"
                />
              </div>
            ))}

            <button onClick={addRow} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Plus className="w-4 h-4" /> Add a review
            </button>

            {error && <p className="text-sm text-destructive pt-2">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button onClick={handleSave} disabled={saving} className="btn-hero text-xs flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save reviews
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                  <Check className="w-4 h-4" /> Saved. The homepage now shows these.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminReviews;
