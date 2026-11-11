import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Gauge, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";
import { vehiclePath, optimizeImage, priceText, statusLabel } from "@/lib/vehicleSeo";

interface Props {
  /** Which vehicles belong on this page, e.g. (v) => v.type === "SUV". */
  filter: (v: Vehicle) => boolean;
  /** Shown when the filter currently matches nothing (e.g. no SUVs in stock this week). */
  emptyMessage: string;
}

// The filtered inventory grid shared by the category/city landing pages (/used-suvs,
// /rebuilt-title-cars, etc.) — same card styling as FeaturedCars, but filtered and without the
// homepage-specific intro copy.
const VehicleGrid = ({ filter, emptyMessage }: Props) => {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);

  useEffect(() => {
    supabase
      .from("vehicles")
      .select("*")
      .neq("status", "sold")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVehicles((data as Vehicle[]) ?? []));
  }, []);

  if (vehicles === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const matches = vehicles.filter(filter);

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <p className="text-body mb-4">{emptyMessage}</p>
        <Link to="/inventory" className="btn-hero inline-flex items-center gap-2">
          Browse All Inventory <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((car) => (
        <Link key={car.id} to={vehiclePath(car)} className="block card-cinematic group h-full">
          <div className="aspect-[4/3] overflow-hidden">
            {car.image_url ? (
              <img
                src={optimizeImage(car.image_url, 800)}
                alt={car.name}
                loading="lazy"
                decoding="async"
                className="card-image w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary min-h-[200px]" />
            )}
          </div>
          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-1">
              {car.year} · {car.type} · {statusLabel(car.status)}
            </p>
            <h3 className="text-lg font-bold text-foreground mb-1 leading-tight">{car.name}</h3>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-xl font-bold text-foreground">{priceText(car.price)}</p>
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
      ))}
    </div>
  );
};

export default VehicleGrid;
