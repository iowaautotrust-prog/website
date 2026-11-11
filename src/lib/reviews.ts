// Real customer reviews shown in the "Google Reviews" section of the home page.
//
// Only paste reviews that are really on the Google Business Profile, word for word, with the reviewer's
// name as Google shows it. Until at least one review is listed here the section shows two links instead
// ("Read our Google reviews" and "Leave a review") and makes no claims about ratings.
//
// How to add one: open the Google Business Profile -> Reviews, copy the text of a 5-star review, and add
//   { author: "Jane D.", text: "Great experience, easy and honest.", when: "October 2026" },
// to the list below. Keep to 3 to 6 reviews; the section shows them in this order.

export interface GoogleReview {
  author: string;
  text: string;
  /** Optional, e.g. "October 2026" or "2 weeks ago". */
  when?: string;
}

export const GOOGLE_REVIEWS: GoogleReview[] = [];
