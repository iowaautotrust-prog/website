import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { vehicles } from "@/data/vehicles";
import { ArrowRight } from "lucide-react";

const FeaturedCars = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const featured = vehicles.slice(0, 4);

  return (
    <section ref={ref} className="section-spacing section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="text-overline mb-4">Featured</p>
        <h2 className="heading-section mb-4">Handpicked for You</h2>
        <p className="text-body max-w-lg mb-16">
          Every vehicle in our collection has been carefully selected and inspected to meet our exacting standards.
        </p>
      </motion.div>

      <div className="space-y-8">
        {featured.map((car, i) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link to={`/vehicle/${car.id}`} className="block card-cinematic group">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-3/5 aspect-[16/10] md:aspect-auto overflow-hidden">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="card-image w-full h-full object-cover"
                  />
                </div>
                <div className="md:w-2/5 p-8 md:p-12 flex flex-col justify-between">
                  <div>
                    <p className="text-overline mb-3">{car.year} · {car.type}</p>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">{car.name}</h3>
                    <p className="text-body line-clamp-2">{car.description}</p>
                  </div>
                  <div className="mt-8 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-foreground">${car.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">{car.mileage.toLocaleString()} miles</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                      View Details <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
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
