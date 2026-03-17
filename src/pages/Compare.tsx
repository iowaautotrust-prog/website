import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { getVehicles } from "@/data/vehicles";
import { ArrowLeft, X } from "lucide-react";
import Footer from "@/components/Footer";

const specs = [
  { label: "Price", fn: (v: any) => `$${v.price.toLocaleString()}` },
  { label: "Year", fn: (v: any) => v.year },
  { label: "Mileage", fn: (v: any) => `${v.mileage.toLocaleString()} mi` },
  { label: "Engine", fn: (v: any) => v.engine },
  { label: "Fuel", fn: (v: any) => v.fuel },
  { label: "Transmission", fn: (v: any) => v.transmission },
  { label: "Type", fn: (v: any) => v.type },
  { label: "Seats", fn: (v: any) => v.seats },
];

const Compare = () => {
  const { compareList, toggleCompare, clearCompare } = useApp();
  const allVehicles = getVehicles();
  const cars = compareList.map((id) => allVehicles.find((v) => v.id === id)).filter(Boolean) as any[];

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-8">
        <Link to="/inventory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-overline mb-3">Compare</p>
            <h1 className="heading-section">Compare Vehicles</h1>
          </div>
          {cars.length > 0 && (
            <button onClick={clearCompare} className="text-sm text-destructive hover:underline">Clear All</button>
          )}
        </div>
      </div>

      <div className="section-padding pb-24 mt-12">
        {cars.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-body mb-4">No vehicles selected for comparison.</p>
            <Link to="/inventory" className="btn-hero">Browse Inventory</Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Vehicle Headers */}
            <div className="grid gap-6" style={{ gridTemplateColumns: `180px repeat(${cars.length}, 1fr)` }}>
              <div />
              {cars.map((car) => (
                <div key={car.id} className="text-center relative">
                  <button onClick={() => toggleCompare(car.id)} className="absolute top-0 right-0 p-1 rounded-full hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="rounded-xl overflow-hidden aspect-[4/3] mb-4">
                    <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{car.name}</h3>
                </div>
              ))}
            </div>

            {/* Specs */}
            <div className="mt-8 border-t border-border">
              {specs.map((spec, i) => (
                <div
                  key={spec.label}
                  className={`grid gap-6 py-4 border-b border-border ${i % 2 === 0 ? "bg-secondary/50" : ""}`}
                  style={{ gridTemplateColumns: `180px repeat(${cars.length}, 1fr)` }}
                >
                  <p className="text-sm font-semibold text-muted-foreground px-4">{spec.label}</p>
                  {cars.map((car) => (
                    <p key={car.id} className="text-sm font-medium text-foreground text-center">{spec.fn(car)}</p>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Compare;
