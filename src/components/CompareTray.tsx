import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";

export default function CompareTray() {
  const { compareList, toggleCompare, clearCompare } = useApp();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (compareList.length === 0) {
      setVehicles([]);
      return;
    }
    supabase
      .from("vehicles")
      .select("id, name, image_url, price")
      .in("id", compareList)
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []));
  }, [compareList]);

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-foreground text-background shadow-2xl"
      >
        <div className="section-padding py-3 flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <GitCompare className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">
              Compare ({compareList.length}/3)
            </span>
          </div>

          {/* Vehicle thumbnails */}
          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-background/10 rounded-lg px-3 py-1.5 shrink-0"
              >
                {v.image_url && (
                  <img
                    src={v.image_url}
                    alt={v.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                )}
                <span className="text-xs font-medium text-background/90 truncate max-w-[100px]">
                  {v.name}
                </span>
                <button
                  onClick={() => toggleCompare(v.id)}
                  className="text-background/60 hover:text-background transition-colors"
                  aria-label={`Remove ${v.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {/* Placeholder slots */}
            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-20 h-9 border border-dashed border-background/30 rounded-lg flex items-center justify-center shrink-0"
              >
                <span className="text-xs text-background/30">+ Add</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="text-xs text-background/60 hover:text-background transition-colors"
            >
              Clear
            </button>
            <Link
              to="/compare"
              className="btn-hero text-xs bg-primary text-primary-foreground"
            >
              Compare Now
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
