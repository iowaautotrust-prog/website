import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import heroCar from "@/assets/hero-car.jpg";

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden">
      {/* Background image with parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: imageY, scale: imageScale }}
      >
        <img
          src={heroCar}
          alt="Luxury vehicle"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/40" />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-start justify-end h-full section-padding pb-24 md:pb-32"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="text-overline text-primary-foreground/70 mb-6"
        >
          Premium Pre-Owned Vehicles
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-[0.9] text-primary-foreground max-w-5xl"
        >
          Drive
          <br />
          <span className="text-primary">Beyond</span>
          <br />
          Ordinary
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          className="mt-8 text-lg text-primary-foreground/70 max-w-md"
        >
          Curated collection of exceptional pre-owned vehicles, each one meticulously inspected and certified.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
          className="mt-10 flex gap-4"
        >
          <Link to="/inventory" className="btn-hero">
            Explore Collection
          </Link>
          <a href="#quiz" className="btn-hero-outline border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-foreground">
            Find Your Match
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
