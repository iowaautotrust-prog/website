import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const CONSENT_KEY = "iat_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so the page can render first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem(CONSENT_KEY, type);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="section-padding py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Text */}
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                We use cookies to improve your experience. By continuing you
                agree to our{" "}
                <Link
                  to="/privacy"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => accept("essential")}
                  className="text-xs font-medium px-4 py-2 rounded-lg border border-border text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Manage Preferences
                </button>
                <button
                  onClick={() => accept("all")}
                  className="text-xs font-semibold px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={() => accept("essential")}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
