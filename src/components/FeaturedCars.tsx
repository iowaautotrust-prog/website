import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { DEMO_VEHICLES } from "@/lib/demoData";
import type { Vehicle } from "@/lib/types";
import { ArrowRight, Gauge } from "lucide-react";

const FeaturedCars = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [featured, setFeatured] = useState<Vehicle[]>([]);
  const { isDemoMode } = useApp();

  useEffect(() => {
    if (isDemoMode) {
      setFeatured(DEMO_VEHICLES.slice(0, 4));
      return;
    }
    supabase
      .from("vehicles")
      .select("*")
      .eq("status", "available")
      .order("view_count", { ascending: false })
      .limit(4)
      .then(({ data }) => setFeatured((data as Vehicle[]) ?? []));
  }, [isDemoMode]);

  if (featured.length === 0) return null;

  return (
    <section ref={ref} className="section-spacing section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12"
      >
        <p className="text-overline mb-3">Featured</p>
        <h2 className="heading-section mb-3">Handpicked for You</h2>
        <p className="text-body max-w-lg">
          Every vehicle carefully selected and inspected to meet our exacting standards.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {featured.map((car, i) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link to={`/vehicle/${car.id}`} className="block card-cinematic group h-full">
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                {car.image_url ? (
                  <img
                    src={car.image_url}
                    alt={car.name}
                    className="card-image w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary min-h-[200px]" />
                )}
              </div>

              {/* Details */}
              <div className="p-6">
                <p className="text-xs text-muted-foreground mb-1">
                  {car.year} · {car.type}
                </p>
                <h3 className="text-lg font-bold text-foreground mb-1 leading-tight">
                  {car.name}
                </h3>
                {car.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {car.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-foreground">${car.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Gauge className="w-3 h-3" />
                      {car.mileage.toLocaleString()} mi
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCars;
