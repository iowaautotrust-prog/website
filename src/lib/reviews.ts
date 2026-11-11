// Real customer reviews shown in the "Google Reviews" section of the home page.
// Stored as JSON in the existing `settings` table (key: google_reviews) so the dealership can add
// or edit reviews themselves in Admin -> Reviews, without a code change. Empty by default: until at
// least one is added, the homepage section shows "Read our Google reviews" / "Leave us a review"
// links only, and makes no claims about ratings.
//
// Only ever store a review that is really on the Google Business Profile, word for word, with the
// reviewer's name exactly as Google shows it.

import { supabase } from "./supabase";

export interface GoogleReview {
  author: string;
  text: string;
  /** Optional, e.g. "October 2026" or "2 weeks ago". */
  when?: string;
}

export const REVIEWS_SETTING_KEY = "google_reviews";

const clean = (s: unknown, max: number): string => String(s ?? "").trim().slice(0, max);

/** Validates stored JSON; returns null if it is unusable so callers fall back to an empty list. */
export const parseReviews = (raw: string | null | undefined): GoogleReview[] | null => {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    const out = arr
      .map((r) => ({ author: clean(r?.author, 80), text: clean(r?.text, 600), when: clean(r?.when, 40) || undefined }))
      .filter((r) => r.author && r.text);
    return out;
  } catch {
    return null;
  }
};

export const loadReviews = async (): Promise<GoogleReview[]> => {
  try {
    const { data } = await supabase.from("settings").select("value").eq("key", REVIEWS_SETTING_KEY).maybeSingle();
    return parseReviews((data as { value: string } | null)?.value) ?? [];
  } catch {
    return [];
  }
};
