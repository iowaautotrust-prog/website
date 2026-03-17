import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import brandStory from "@/assets/brand-story.jpg";
import brandStory2 from "@/assets/brand-story-2.jpg";

const BrandStory = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const imgRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: imgRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const img2Ref = useRef(null);
  const { scrollYProgress: sp2 } = useScroll({ target: img2Ref, offset: ["start end", "end start"] });
  const img2Y = useTransform(sp2, [0, 1], ["0%", "10%"]);

  return (
    <section ref={ref}>
      {/* Section 1: Image Left, Text Right */}
      <div className="section-spacing section-padding">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          <motion.div
            ref={imgRef}
            className="lg:w-1/2 overflow-hidden rounded-2xl"
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.img
              src={brandStory}
              alt="Premium vehicle exterior"
              className="w-full h-[500px] lg:h-[600px] object-cover"
              style={{ y: imgY }}
            />
          </motion.div>

          <div className="lg:w-1/2">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-overline mb-6"
            >
              Our Promise
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="heading-section mb-6"
            >
              Quality Without
              <br />Compromise
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-body mb-8"
            >
              Every vehicle undergoes a rigorous 150-point inspection process. We partner only with certified dealerships and private sellers who share our commitment to excellence.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-12"
            >
              <div>
                <p className="text-4xl font-bold text-primary">150+</p>
                <p className="text-sm text-muted-foreground mt-1">Point Inspection</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">2yr</p>
                <p className="text-sm text-muted-foreground mt-1">Warranty</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground mt-1">Certified</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Section 2: Text Left, Image Right (alternating) */}
      <div className="section-spacing section-padding bg-secondary">
        <div className="flex flex-col lg:flex-row-reverse gap-16 lg:gap-24 items-center">
          <motion.div
            ref={img2Ref}
            className="lg:w-1/2 overflow-hidden rounded-2xl"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.img
              src={brandStory2}
              alt="Premium vehicle interior"
              className="w-full h-[500px] lg:h-[600px] object-cover"
              style={{ y: img2Y }}
            />
          </motion.div>

          <div className="lg:w-1/2">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-overline mb-6"
            >
              The Experience
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="heading-section mb-6"
            >
              Luxury Meets
              <br />Transparency
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-body"
            >
              Full vehicle history reports, transparent pricing with no hidden fees, and a seamless digital buying experience. From first click to first drive, we make every moment count.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
