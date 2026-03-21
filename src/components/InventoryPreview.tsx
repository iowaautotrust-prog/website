import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { DEMO_VEHICLES } from "@/lib/demoData";
import type { Vehicle } from "@/lib/types";
import { ArrowRight } from "lucide-react";

const InventoryPreview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { isDemoMode } = useApp();

  useEffect(() => {
    if (isDemoMode) {
      setVehicles(DEMO_VEHICLES.slice(4, 8));
      return;
    }
    supabase
      .from("vehicles")
      .select("*")
      .in("status", ["available", "pending"])
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []));
  }, [isDemoMode]);

  if (vehicles.length === 0) return null;

  return (
    <section ref={ref} className="section-spacing section-padding bg-secondary">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <p className="text-overline mb-4">Collection</p>
        <h2 className="heading-section mb-4">Current Inventory</h2>
        <p className="text-body">A glimpse of what's available. Each vehicle tells its own story.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {vehicles.map((car, i) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * i }}
          >
            <Link to={`/vehicle/${car.id}`} className="card-cinematic block group">
              <div className="aspect-[4/3] overflow-hidden">
                {car.image_url ? (
                  <img src={car.image_url} alt={car.name} className="card-image w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary/60 min-h-[200px]" />
                )}
              </div>
              <div className="p-6">
                <p className="text-xs text-muted-foreground mb-1">{car.year} · {car.mileage.toLocaleString()} mi</p>
                <h3 className="text-xl font-bold text-foreground">{car.name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xl font-bold text-primary">${car.price.toLocaleString()}</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center mt-16"
      >
        <Link to="/inventory" className="btn-hero">
          View All Inventory <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </motion.div>
    </section>
  );
};

export default InventoryPreview;
