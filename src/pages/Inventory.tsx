import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { vehicles } from "@/data/vehicles";
import { ArrowRight, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import Footer from "@/components/Footer";

const types = ["All", "Sedan", "SUV", "Coupe"];
const fuels = ["All", "Petrol", "Diesel", "Hybrid"];

const Inventory = () => {
  const [typeFilter, setTypeFilter] = useState("All");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = vehicles.filter((v) => {
    if (typeFilter !== "All" && v.type !== typeFilter) return false;
    if (fuelFilter !== "All" && v.fuel !== fuelFilter) return false;
    return true;
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="section-padding pt-8 pb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-overline mb-3">Inventory</p>
          <h1 className="heading-section">Our Collection</h1>
        </motion.div>
      </div>

      <div className="section-padding pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`lg:w-64 shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="sticky top-8 space-y-8">
              <div className="flex items-center justify-between lg:justify-start gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Type</p>
                <div className="space-y-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                        typeFilter === t
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Fuel</p>
                <div className="space-y-2">
                  {fuels.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFuelFilter(f)}
                      className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                        fuelFilter === f
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 text-sm font-medium text-foreground mb-4"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          {/* Vehicle List */}
          <div className="flex-1 space-y-6">
            {filtered.length === 0 && (
              <p className="text-body text-center py-20">No vehicles match your filters.</p>
            )}
            {filtered.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
              >
                <Link to={`/vehicle/${car.id}`} className="card-cinematic flex flex-col sm:flex-row group">
                  <div className="sm:w-2/5 aspect-video sm:aspect-auto overflow-hidden">
                    <img src={car.image} alt={car.name} className="card-image w-full h-full object-cover sm:h-64" />
                  </div>
                  <div className="sm:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <p className="text-overline mb-2">{car.year} · {car.type} · {car.fuel}</p>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">{car.name}</h3>
                      <p className="text-body line-clamp-2 mt-2">{car.description}</p>
                    </div>
                    <div className="flex items-end justify-between mt-6">
                      <div>
                        <p className="text-2xl font-bold text-primary">${car.price.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{car.mileage.toLocaleString()} miles</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                        Details <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Inventory;
