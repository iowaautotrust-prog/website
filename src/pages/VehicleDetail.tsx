import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { vehicles } from "@/data/vehicles";
import { ArrowLeft, Fuel, Users, Calendar, Gauge, Check } from "lucide-react";
import Footer from "@/components/Footer";
import { useState } from "react";

const VehicleDetail = () => {
  const { id } = useParams();
  const car = vehicles.find((v) => v.id === id);
  const [selectedImage, setSelectedImage] = useState(0);

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
            <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-4">
              <img
                src={car.images[selectedImage]}
                alt={car.name}
                className="w-full h-full object-cover"
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
              <p className="text-4xl font-bold text-primary mb-8">${car.price.toLocaleString()}</p>

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

              <button className="btn-hero w-full justify-center">
                Express Interest
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VehicleDetail;
