import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BUDGET_SETTING_KEY,
  DEFAULT_BUDGET_OPTIONS,
  loadBudgetOptions,
  type BudgetOption,
} from "@/lib/quizBudget";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import Footer from "@/components/Footer";

type Row = { label: string; min: string; max: string };

const toRow = (o: BudgetOption): Row => ({
  label: o.label,
  min: o.min == null ? "" : String(o.min),
  max: o.max == null ? "" : String(o.max),
});

const AdminQuiz = () => {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>(DEFAULT_BUDGET_OPTIONS.map(toRow));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBudgetOptions().then((opts) => {
      setRows(opts.map(toRow));
      setLoading(false);
    });
  }, []);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user?.isAdmin) return <Navigate to="/login" />;

  const setRow = (i: number, patch: Partial<Row>) => {
    setSaved(false);
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setError(null);
    const cleaned: BudgetOption[] = [];
    for (const r of rows) {
      if (!r.label.trim()) continue;
      const min = r.min.trim() === "" ? null : Number(r.min);
      const max = r.max.trim() === "" ? null : Number(r.max);
      if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
        setError(`"${r.label}": min and max must be numbers of 0 or more (or left empty).`);
        return;
      }
      if (min !== null && max !== null && max <= min) {
        setError(`"${r.label}": the maximum must be higher than the minimum.`);
        return;
      }
      cleaned.push({ label: r.label.trim(), min, max });
    }
    if (cleaned.length === 0) {
      setError("Add at least one budget option.");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from("settings")
      .upsert(
        { key: BUDGET_SETTING_KEY, value: JSON.stringify(cleaned), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
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
          <h1 className="heading-section">Homepage Budget Options</h1>
          <p className="text-body mt-2 max-w-xl">
            These are the choices shown in the homepage quiz under "What's your budget?". A car matches an option when its
            price is at least the minimum and below the maximum. Leave a box empty for "no limit".
          </p>
        </div>
      </div>

      <div className="section-padding pb-24 max-w-3xl">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-[1fr_9rem_9rem] gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Button text</span>
              <span>Min price ($)</span>
              <span>Max price ($)</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_9rem] gap-3">
                <Input value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="Under $10K" />
                <Input type="number" min={0} value={r.min} onChange={(e) => setRow(i, { min: e.target.value })} placeholder="No minimum" />
                <Input type="number" min={0} value={r.max} onChange={(e) => setRow(i, { max: e.target.value })} placeholder="No maximum" />
              </div>
            ))}

            {error && <p className="text-sm text-destructive pt-2">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button onClick={handleSave} disabled={saving} className="btn-hero text-xs flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save options
              </button>
              <button
                onClick={() => { setRows(DEFAULT_BUDGET_OPTIONS.map(toRow)); setSaved(false); }}
                className="btn-hero-outline text-xs"
              >
                Reset to defaults
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                  <Check className="w-4 h-4" /> Saved. The homepage quiz now uses these options.
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

export default AdminQuiz;
