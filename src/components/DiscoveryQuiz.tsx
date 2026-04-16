import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Fuel, Users, Car, DollarSign } from "lucide-react";

const steps = [
  {
    title: "What's your budget?",
    key: "budget" as const,
    icon: DollarSign,
    options: [
      { label: "Under $30K", value: "under30" },
      { label: "$30K – $50K", value: "30to50" },
      { label: "$50K – $75K", value: "50to75" },
      { label: "$75K+", value: "over75" },
    ],
  },
  {
    title: "What type of car?",
    key: "type" as const,
    icon: Car,
    options: [
      { label: "Sedan", value: "Sedan" },
      { label: "SUV", value: "SUV" },
      { label: "Coupe", value: "Coupe" },
      { label: "Any", value: "any" },
    ],
  },
  {
    title: "Preferred fuel type?",
    key: "fuel" as const,
    icon: Fuel,
    options: [
      { label: "Petrol", value: "Petrol" },
      { label: "Diesel", value: "Diesel" },
      { label: "Hybrid", value: "Hybrid" },
      { label: "Any", value: "any" },
    ],
  },
  {
    title: "How many seats?",
    key: "seats" as const,
    icon: Users,
    options: [
      { label: "4 Seats", value: "4" },
      { label: "5 Seats", value: "5" },
      { label: "7+ Seats", value: "7" },
      { label: "Any", value: "any" },
    ],
  },
];

interface Answers {
  budget?: string;
  type?: string;
  fuel?: string;
  seats?: string;
}

const buildInventoryUrl = (answers: Answers) => {
  const params = new URLSearchParams();
  if (answers.type && answers.type !== "any") params.set("type", answers.type);
  if (answers.fuel && answers.fuel !== "any") params.set("fuel", answers.fuel);
  const url = `/inventory${params.toString() ? `?${params}` : ""}`;
  return url;
};

const DiscoveryQuiz = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<Vehicle[]>([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  useEffect(() => {
    if (!showResults) return;
    let query = supabase.from("vehicles").select("*").eq("status", "available");
    if (answers.budget) {
      if (answers.budget === "under30")  query = query.lt("price", 30000);
      if (answers.budget === "30to50")   query = query.gte("price", 30000).lte("price", 50000);
      if (answers.budget === "50to75")   query = query.gte("price", 50000).lte("price", 75000);
      if (answers.budget === "over75")   query = query.gt("price", 75000);
    }
    if (answers.type && answers.type !== "any") query = query.eq("type", answers.type);
    if (answers.fuel && answers.fuel !== "any") query = query.eq("fuel", answers.fuel);
    if (answers.seats && answers.seats !== "any") {
      if (answers.seats === "7") query = query.gte("seats", 7);
      else query = query.eq("seats", parseInt(answers.seats));
    }
    query.limit(2).then(({ data }) => setRecommendations((data as Vehicle[]) ?? []));
  }, [showResults]);

  const handleSelect = (key: string, value: string) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setRecommendations([]);
  };

  const step = steps[currentStep];

  return (
    <section id="quiz" ref={ref} className="section-spacing section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <p className="text-overline mb-4">Discovery</p>
        <h2 className="heading-section mb-4">Find the Perfect Car for You</h2>
        <p className="text-body">Answer a few questions and we'll match you with your ideal vehicle.</p>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep || showResults ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="text-center mb-10">
                <step.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {step.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(step.key, option.value)}
                    className={`quiz-tile ${answers[step.key] === option.value ? "quiz-tile-active" : ""}`}
                  >
                    <span className="text-lg font-semibold text-foreground">{option.label}</span>
                  </button>
                ))}
              </div>

              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-foreground">Your Matches</h3>
                <p className="text-body mt-2">Based on your preferences, we recommend:</p>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-6">
                  {recommendations.map((car) => (
                    <Link
                      key={car.id}
                      to={`/vehicle/${car.id}`}
                      className="card-cinematic flex flex-col sm:flex-row overflow-hidden group"
                    >
                      <div className="sm:w-2/5 aspect-video sm:aspect-auto overflow-hidden">
                        {car.image_url ? (
                          <img src={car.image_url} alt={car.name} className="card-image w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-secondary min-h-[160px]" />
                        )}
                      </div>
                      <div className="sm:w-3/5 p-6 flex flex-col justify-center">
                        <p className="text-overline mb-2">{car.year} · {car.fuel}</p>
                        <h4 className="text-xl font-bold text-foreground">{car.name}</h4>
                        <p className="text-2xl font-bold text-primary mt-2">${car.price.toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 group-hover:text-primary transition-colors">
                          View Details <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-body">No exact matches found. Browse our full inventory for more options.</p>
              )}

              <div className="flex justify-center gap-4 mt-10">
                <button onClick={reset} className="btn-hero-outline text-xs">
                  Start Over
                </button>
                <Link to={buildInventoryUrl(answers)} className="btn-hero text-xs">
                  View All Matches
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DiscoveryQuiz;
