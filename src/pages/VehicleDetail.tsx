import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getVehicles } from "@/data/vehicles";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft, Fuel, Users, Calendar, Gauge, Check, Heart, GitCompare, Cog } from "lucide-react";
import Footer from "@/components/Footer";
import InterestDialog from "@/components/InterestDialog";
import { useState, useEffect } from "react";

const VehicleDetail = () => {
  const { id } = useParams();
  const vehicles = getVehicles();
  const car = vehicles.find((v) => v.id === id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInterest, setShowInterest] = useState(false);

  const { user } = useAuth();
  const { toggleFavorite, isFavorite, toggleCompare, isInCompare, addRecentView } = useApp();

  useEffect(() => {
    if (id) addRecentView(id);
  }, [id, addRecentView]);

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="heading-section mb-4">Vehicle Not Found</h1>
          <Link to="/inventory" className="btn-hero">Back to Inventory</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-8">
        <Link to="/inventory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
      </div>

      <div className="section-padding pb-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Gallery */}
          <motion.div
            className="lg:w-3/5"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-4 cursor-zoom-in group">
              <img
                src={car.images[selectedImage]}
                alt={car.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex gap-3">
              {car.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`rounded-lg overflow-hidden w-24 h-16 border-2 transition-all duration-300 ${
                    selectedImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            className="lg:w-2/5"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="lg:sticky lg:top-8">
              <p className="text-overline mb-3">{car.year} · {car.type}</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{car.name}</h1>
              <p className="text-4xl font-bold text-primary mb-4">${car.price.toLocaleString()}</p>

              {/* Quick Actions */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => toggleFavorite(car.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isFavorite(car.id)
                      ? "border-destructive/30 text-destructive bg-destructive/5"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(car.id) ? "fill-destructive" : ""}`} />
                  {isFavorite(car.id) ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => toggleCompare(car.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isInCompare(car.id)
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  {isInCompare(car.id) ? "Comparing" : "Compare"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                  <Gauge className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mileage</p>
                    <p className="text-sm font-semibold text-foreground">{car.mileage.toLocaleString()} mi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                  <Fuel className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fuel</p>
                    <p className="text-sm font-semibold text-foreground">{car.fuel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="text-sm font-semibold text-foreground">{car.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Seats</p>
                    <p className="text-sm font-semibold text-foreground">{car.seats}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                  <Cog className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Engine</p>
                    <p className="text-sm font-semibold text-foreground">{car.engine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                  <Cog className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Transmission</p>
                    <p className="text-sm font-semibold text-foreground">{car.transmission}</p>
                  </div>
                </div>
              </div>

              <p className="text-body mb-8">{car.description}</p>

              <div className="mb-10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Features</h3>
                <div className="space-y-2">
                  {car.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setShowInterest(true)} className="btn-hero w-full justify-center">
                Express Interest
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {showInterest && (
        <InterestDialog vehicle={car} open={showInterest} onClose={() => setShowInterest(false)} />
      )}

      <Footer />
    </div>
  );
};

export default VehicleDetail;
