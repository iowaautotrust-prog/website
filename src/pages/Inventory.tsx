import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { getVehicles } from "@/data/vehicles";
import { useApp } from "@/contexts/AppContext";
import { ArrowRight, ArrowLeft, SlidersHorizontal, X, Heart, GitCompare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";

const types = ["All", "Sedan", "SUV", "Coupe", "Hatchback"];
const fuels = ["All", "Petrol", "Diesel", "Hybrid", "Electric"];
const years = ["All", "2023", "2022", "2021"];
const transmissions = ["All", "Automatic", "Manual", "CVT", "Single-Speed"];

const Inventory = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [typeFilter, setTypeFilter] = useState("All");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [transFilter, setTransFilter] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000]);
  const [mileageMax, setMileageMax] = useState(200000);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);

  const { toggleFavorite, isFavorite, toggleCompare, isInCompare, addRecentSearch, vehicleVersion } = useApp();

  const vehicles = useMemo(() => getVehicles(), [vehicleVersion]);

  const makes = useMemo(() => {
    const m = [...new Set(vehicles.map((v) => v.make))].sort();
    return ["All", ...m];
  }, [vehicles]);
  const [makeFilter, setMakeFilter] = useState("All");

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (typeFilter !== "All" && v.type !== typeFilter) return false;
      if (fuelFilter !== "All" && v.fuel !== fuelFilter) return false;
      if (yearFilter !== "All" && v.year !== parseInt(yearFilter)) return false;
      if (transFilter !== "All" && v.transmission !== transFilter) return false;
      if (makeFilter !== "All" && v.make !== makeFilter) return false;
      if (v.price < priceRange[0] || v.price > priceRange[1]) return false;
      if (v.mileage > mileageMax) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!v.name.toLowerCase().includes(q) && !v.make.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [vehicles, typeFilter, fuelFilter, yearFilter, transFilter, makeFilter, priceRange, mileageMax, searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) addRecentSearch(searchQuery.trim());
  };

  const FilterBlock = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
      <div className="space-y-1">
        {options.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
              value === t
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  const filtersContent = (
    <div className="sticky top-8 space-y-6">
      <div className="flex items-center justify-between lg:justify-start gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Filters</h3>
        <button onClick={() => setShowFilters(false)} className="lg:hidden text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Price Range</p>
        <div className="space-y-2">
          <input
            type="range"
            min={0} max={150000} step={5000}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Mileage */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Max Mileage</p>
        <input
          type="range"
          min={0} max={200000} step={5000}
          value={mileageMax}
          onChange={(e) => setMileageMax(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">{mileageMax.toLocaleString()} mi</p>
      </div>

      <FilterBlock label="Make" options={makes} value={makeFilter} onChange={setMakeFilter} />
      <FilterBlock label="Type" options={types} value={typeFilter} onChange={setTypeFilter} />
      <FilterBlock label="Fuel" options={fuels} value={fuelFilter} onChange={setFuelFilter} />
      <FilterBlock label="Year" options={years} value={yearFilter} onChange={setYearFilter} />
      <FilterBlock label="Transmission" options={transmissions} value={transFilter} onChange={setTransFilter} />
    </div>
  );

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
          <h1 className="heading-section mb-6">Our Collection</h1>
        </motion.div>

        {/* Search */}
        <div className="flex gap-2 max-w-lg mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search vehicles..."
              className="pl-9"
            />
          </div>
          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md">
            Search
          </button>
        </div>
      </div>

      <div className="section-padding pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:block lg:w-64 shrink-0"
          >
            {filtersContent}
          </motion.aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/30 z-40 lg:hidden"
                  onClick={() => setShowFilters(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25 }}
                  className="fixed left-0 top-0 bottom-0 w-80 bg-background z-50 p-6 overflow-y-auto lg:hidden"
                >
                  {filtersContent}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 text-sm font-medium text-foreground -mt-4 mb-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          {/* Vehicle List */}
          <div className="flex-1 space-y-6">
            <p className="text-sm text-muted-foreground mb-2">{filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} found</p>
            {filtered.length === 0 && (
              <p className="text-body text-center py-20">No vehicles match your filters.</p>
            )}
            {filtered.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 * Math.min(i, 10) }}
              >
                <div className="card-cinematic flex flex-col sm:flex-row group relative">
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(car.id); }}
                      className="p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(car.id) ? "text-destructive fill-destructive" : "text-muted-foreground"}`} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleCompare(car.id); }}
                      className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isInCompare(car.id) ? "bg-primary text-primary-foreground" : "bg-background/80 hover:bg-background text-muted-foreground"}`}
                    >
                      <GitCompare className="w-4 h-4" />
                    </button>
                  </div>
                  <Link to={`/vehicle/${car.id}`} className="sm:w-2/5 aspect-video sm:aspect-auto overflow-hidden">
                    <img src={car.image} alt={car.name} className="card-image w-full h-full object-cover sm:h-64" />
                  </Link>
                  <Link to={`/vehicle/${car.id}`} className="sm:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <p className="text-overline mb-2">{car.year} · {car.type} · {car.fuel} · {car.transmission}</p>
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
                  </Link>
                </div>
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
