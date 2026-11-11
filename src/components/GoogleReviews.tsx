import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { loadReviews, type GoogleReview } from "@/lib/reviews";

const Stars = () => (
  <div className="flex gap-0.5" role="img" aria-label="5 out of 5 stars">
    {[0, 1, 2, 3, 4].map((i) => (
      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
    ))}
  </div>
);

// Trust is the biggest factor for a used-car buyer: real Google reviews, and an easy way to add one.
// The reviews themselves are editable in Admin -> Reviews (no code change needed to add/update one).
const GoogleReviews = () => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);

  useEffect(() => {
    loadReviews().then(setReviews);
  }, []);

  return (
    <section className="section-spacing section-padding border-t border-border" aria-labelledby="reviews-heading">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-10 max-w-2xl"
      >
        <p className="text-overline mb-3">Reviews</p>
        <h2 id="reviews-heading" className="heading-section mb-3">What Our Customers Say</h2>
        <p className="text-body">
          {reviews.length > 0
            ? "Real reviews from real buyers, straight from Google."
            : "See what buyers say about their experience with Iowa Trust Motors on Google."}
        </p>
      </motion.div>

      {reviews.length > 0 && (
        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.figure
              key={`${r.author}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: 0.06 * i }}
              className="flex h-full flex-col rounded-2xl border border-border bg-secondary/40 p-6"
            >
              <Stars />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-foreground">
                {r.author}
                {r.when && <span className="ml-2 font-normal text-muted-foreground">{r.when}</span>}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={SITE.social.googleBusiness}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-hero inline-flex items-center justify-center gap-2"
        >
          Read our Google reviews <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={SITE.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Star className="h-4 w-4" aria-hidden="true" /> Leave us a review
        </a>
      </div>
    </section>
  );
};

export default GoogleReviews;
