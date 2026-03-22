import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";
import { ArrowLeft, X, Loader2, TrendingDown } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useMemo, useState, useEffect } from "react";

const specRows = [
  { label: "Price", key: "price", format: (v: Vehicle) => `$${v.price.toLocaleString()}` },
  { label: "Year", key: "year", format: (v: Vehicle) => String(v.year) },
  { label: "Mileage", key: "mileage", format: (v: Vehicle) => `${v.mileage.toLocaleString()} mi` },
  { label: "Type", key: "type", format: (v: Vehicle) => v.type },
  { label: "Engine", key: "engine", format: (v: Vehicle) => v.engine ?? "—" },
  { label: "Fuel", key: "fuel", format: (v: Vehicle) => v.fuel },
  { label: "Transmission", key: "transmission", format: (v: Vehicle) => v.transmission ?? "—" },
  { label: "Seats", key: "seats", format: (v: Vehicle) => String(v.seats ?? "—") },
  { label: "Status", key: "status", format: (v: Vehicle) => v.status === "available" ? "Available" : "Sale Pending" },
];

const Compare = () => {
  const { compareList, toggleCompare, clearCompare } = useApp();
  const [cars, setCars] = useState<Vehicle[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [addId, setAddId] = useState("");

  // Fetch compared vehicles from Supabase
  useEffect(() => {
    if (compareList.length === 0) { setCars([]); return; }
    setLoading(true);
    supabase
      .from("vehicles")
      .select("*")
      .in("id", compareList)
      .then(({ data }) => {
        // Maintain compare order
        const map: Record<string, Vehicle> = {};
        (data as Vehicle[] ?? []).forEach((v) => { map[v.id] = v; });
        setCars(compareList.map((id) => map[id]).filter(Boolean));
        setLoading(false);
      });
  }, [compareList]);

  // Fetch available vehicles for the "add" dropdown
  useEffect(() => {
    supabase
      .from("vehicles")
      .select("id, name, price, year, type")
      .eq("status", "available")
      .order("name")
      .then(({ data }) => setAllVehicles((data as Vehicle[]) ?? []));
  }, []);

  const availableToAdd = useMemo(
    () => allVehicles.filter((v) => !compareList.includes(v.id)),
    [allVehicles, compareList]
  );

  const canAddMore = compareList.length < 3;

  // Find the lowest price among compared cars
  const lowestPrice = cars.length > 1 ? Math.min(...cars.map((c) => c.price)) : null;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="section-padding pt-28 pb-6">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <p className="text-overline mb-3">Side-by-Side</p>
            <h1 className="heading-section">Compare Vehicles</h1>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            {cars.length > 0 && (
              <button
                onClick={clearCompare}
                className="text-sm text-destructive hover:underline"
              >
                Clear All
              </button>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="flex h-10 w-full sm:w-72 rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!canAddMore || availableToAdd.length === 0}
              >
                <option value="">
                  {canAddMore ? "Add a vehicle to compare…" : "Max 3 vehicles"}
                </option>
                {availableToAdd.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — ${v.price.toLocaleString()}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!addId) return;
                  toggleCompare(addId);
                  setAddId("");
                }}
                disabled={!addId || !canAddMore}
                className="btn-hero text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {!canAddMore && (
              <p className="text-xs text-muted-foreground">
                Maximum 3 vehicles can be compared at once.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="section-padding pb-24 mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : cars.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-body mb-4">No vehicles selected for comparison.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Browse our inventory and click the compare icon on any vehicle to
              add it here.
            </p>
            <Link to="/inventory" className="btn-hero">
              Browse Inventory
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-x-auto"
          >
            {/* Vehicle Headers */}
            <div
              className="grid gap-4 min-w-[480px]"
              style={{
                gridTemplateColumns: `160px repeat(${cars.length}, 1fr)`,
              }}
            >
              <div />
              {cars.map((car) => (
                <div key={car.id} className="text-center relative">
                  <button
                    onClick={() => toggleCompare(car.id)}
                    className="absolute top-0 right-0 p-1 rounded-full hover:bg-secondary z-10"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="rounded-xl overflow-hidden aspect-[4/3] mb-3">
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={car.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {car.name}
                  </h3>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      lowestPrice !== null && car.price === lowestPrice
                        ? "text-green-600"
                        : "text-primary"
                    }`}
                  >
                    ${car.price.toLocaleString()}
                    {lowestPrice !== null && car.price === lowestPrice && cars.length > 1 && (
                      <span className="text-xs ml-1 font-normal inline-flex items-center gap-0.5 text-green-600">
                        <TrendingDown className="w-3 h-3" /> Best price
                      </span>
                    )}
                  </p>
                  <Link
                    to={`/vehicle/${car.id}`}
                    className="inline-block mt-3 text-xs font-medium text-primary hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>

            {/* Specs Table */}
            <div className="mt-8 rounded-xl border border-border overflow-hidden min-w-[480px]">
              {specRows.map((spec, i) => (
                <div
                  key={spec.label}
                  className={`grid gap-4 border-b border-border last:border-0 ${
                    i % 2 === 0 ? "bg-secondary/30" : "bg-background"
                  }`}
                  style={{
                    gridTemplateColumns: `160px repeat(${cars.length}, 1fr)`,
                  }}
                >
                  <p className="text-sm font-semibold text-muted-foreground px-5 py-4">
                    {spec.label}
                  </p>
                  {cars.map((car) => {
                    const value = spec.format(car);
                    // Highlight price differences
                    const isPriceRow = spec.key === "price";
                    const isBest =
                      isPriceRow &&
                      lowestPrice !== null &&
                      car.price === lowestPrice &&
                      cars.length > 1;
                    return (
                      <p
                        key={car.id}
                        className={`text-sm font-medium text-center px-4 py-4 ${
                          isBest ? "text-green-600 font-semibold" : "text-foreground"
                        }`}
                      >
                        {value}
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Price difference callout */}
            {cars.length > 1 && lowestPrice !== null && (
              <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">
                  <span className="font-semibold">
                    {cars.find((c) => c.price === lowestPrice)?.name}
                  </span>{" "}
                  is the best-priced option — saving you up to{" "}
                  <span className="font-semibold">
                    ${(Math.max(...cars.map((c) => c.price)) - lowestPrice).toLocaleString()}
                  </span>{" "}
                  compared to the most expensive option.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Compare;
