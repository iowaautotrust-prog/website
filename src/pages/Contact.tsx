import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Lead } from "@/lib/types";

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "(515) 672-5406",
    href: "tel:5156725406",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@iowaautotrust.com",
    href: "mailto:info@iowaautotrust.com",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "204 S Main St, Woodward, IA 50276",
    href: "https://maps.google.com/?q=204+S+Main+St+Woodward+IA+50276",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon–Sat: 9am – 6pm\nSunday: Closed",
    href: null,
  },
];

export default function Contact() {
  const { user } = useAuth();
  const { addLead } = useApp();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const lead: Omit<Lead, "id" | "created_at"> = {
        user_id: user?.id ?? null,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        vehicle_id: null,
        vehicle_name: null,
        message: form.message,
        lead_type: "contact",
        status: "new",
      };
      await addLead(lead);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try calling us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="section-padding">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">
              Get In Touch
            </p>
            <h1 className="heading-section mb-4">Contact Iowa Auto Trust</h1>
            <p className="text-muted-foreground max-w-xl">
              Have a question about a vehicle or ready to schedule a visit? Reach
              out — we'd love to help you find your next car.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-8"
            >
              {contactInfo.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-5">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors font-medium whitespace-pre-line"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-foreground font-medium whitespace-pre-line">{value}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Map embed placeholder */}
              <div className="rounded-xl overflow-hidden border border-border h-56 mt-8">
                <iframe
                  title="Iowa Auto Trust location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d-93.9277!3d41.857!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s204+S+Main+St%2C+Woodward%2C+IA+50276!5e0!3m2!1sen!2sus!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Message Sent!</h3>
                  <p className="text-muted-foreground max-w-xs">
                    Thanks for reaching out. We'll get back to you within one
                    business day.
                  </p>
                  <a
                    href="tel:5156725406"
                    className="btn-hero mt-2"
                  >
                    Call Us Now
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="(515) 000-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      required
                      placeholder="What vehicle are you interested in? Or any questions..."
                      className="min-h-[140px] resize-none"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="btn-hero w-full flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Message
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Or call us directly at{" "}
                    <a href="tel:5156725406" className="text-primary font-medium">
                      (515) 672-5406
                    </a>
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
