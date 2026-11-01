// Budget choices for the homepage "What's your budget?" quiz.
// Stored as JSON in the existing `settings` table (key: quiz_budget_options) so the
// dealership can change them in Admin without a code change. Falls back to DEFAULTS.

import { supabase } from "./supabase";

export interface BudgetOption {
  label: string;
  /** inclusive lower bound in dollars, null = no lower bound */
  min: number | null;
  /** exclusive upper bound in dollars, null = no upper bound */
  max: number | null;
}

export const BUDGET_SETTING_KEY = "quiz_budget_options";

export const DEFAULT_BUDGET_OPTIONS: BudgetOption[] = [
  { label: "Under $10K", min: null, max: 10000 },
  { label: "$10K – $15K", min: 10000, max: 15000 },
  { label: "$15K – $20K", min: 15000, max: 20000 },
  { label: "$20K+", min: 20000, max: null },
];

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;

/** Validates stored JSON; returns null if it is unusable so callers use the defaults. */
export const parseBudgetOptions = (raw: string | null | undefined): BudgetOption[] | null => {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const out = arr
      .map((o) => ({ label: String(o?.label ?? "").trim(), min: num(o?.min), max: num(o?.max) }))
      .filter((o) => o.label);
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
};

export const loadBudgetOptions = async (): Promise<BudgetOption[]> => {
  try {
    const { data } = await supabase.from("settings").select("value").eq("key", BUDGET_SETTING_KEY).maybeSingle();
    return parseBudgetOptions((data as { value: string } | null)?.value) ?? DEFAULT_BUDGET_OPTIONS;
  } catch {
    return DEFAULT_BUDGET_OPTIONS;
  }
};
