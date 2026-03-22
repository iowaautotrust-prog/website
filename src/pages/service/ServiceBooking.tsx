import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";

const SERVICE_TYPES = [
  "Oil Change",
  "Filter Replacement",
  "Full Service",
  "Tire Rotation",
  "Inspection",
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              s < step
                ? "bg-primary text-primary-foreground"
                : s === step
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {s < step ? <CheckCircle className="w-4 h-4" /> : s}
          </div>
          {s < 4 && (
            <div
              className={`w-16 h-0.5 transition-all duration-300 ${
                s < step ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const color = passed === 0 ? "bg-border" : passed === 1 ? "bg-red-500" : passed === 2 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passed ? color : "bg-border"}`} />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map((c) => (
          <p key={c.label} className={`text-xs ${c.ok ? "text-green-600" : "text-muted-foreground"}`}>
            {c.ok ? "✓" : "·"} {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}

const ServiceBooking = () => {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [appointmentRef, setAppointmentRef] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [personal, setPersonal] = useState({ name: "", phone: "", email: "" });
  const [vehicle, setVehicle] = useState({ make: "", model: "", year: "", plate: "", color: "" });
  const [appt, setAppt] = useState({ service_type: "Oil Change", date: "", time: "", notes: "" });
  const [account, setAccount] = useState({ password: "", confirm: "" });

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!personal.name.trim() || !personal.email.trim()) { setError("Name and email are required."); return; }
    }
    if (step === 2) {
      if (!vehicle.make.trim() || !vehicle.model.trim()) { setError("Make and model are required."); return; }
    }
    if (step === 3) {
      if (!appt.date || !appt.time) { setError("Please choose a date and time."); return; }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setError(null);
    if (account.password.length < 8 || !/[A-Z]/.test(account.password) || !/[0-9]/.test(account.password)) {
      setError("Password does not meet requirements."); return;
    }
    if (account.password !== account.confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      // Create auth account
      const { error: authErr } = await signUp(personal.email, account.password, personal.name);
      if (authErr) throw new Error(authErr);

      // Insert shop_customer
      const { data: customer, error: custErr } = await supabase
        .from("shop_customers" as any)
        .insert({ name: personal.name, phone: personal.phone || null, email: personal.email })
        .select()
        .single();
      if (custErr) throw new Error(custErr.message);

      // Insert shop_vehicle
      const { data: veh, error: vehErr } = await supabase
        .from("shop_vehicles" as any)
        .insert({
          customer_id: (customer as any).id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year ? parseInt(vehicle.year) : null,
          plate: vehicle.plate || null,
          color: vehicle.color || null,
        })
        .select()
        .single();
      if (vehErr) throw new Error(vehErr.message);

      // Insert appointment
      const scheduledAt = `${appt.date}T${appt.time}:00`;
      const ref = `APT-${Date.now().toString(36).toUpperCase()}`;
      const { error: apptErr } = await supabase
        .from("appointments" as any)
        .insert({
          customer_id: (customer as any).id,
          vehicle_id: (veh as any).id,
          guest_name: personal.name,
          guest_phone: personal.phone || null,
          guest_email: personal.email,
          scheduled_at: scheduledAt,
          service_type: appt.service_type,
          notes: appt.notes || null,
          status: "scheduled",
          reminder_5d_sent: false,
          reminder_2d_sent: false,
        });
      if (apptErr) throw new Error(apptErr.message);

      setAppointmentRef(ref);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="section-padding pt-32 pb-24 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You're all set!</h2>
            <p className="text-muted-foreground mb-6">
              Your appointment has been booked. We'll see you soon!
            </p>
            <div className="rounded-xl border border-border p-6 mb-6 text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Appointment Reference</p>
              <p className="text-2xl font-mono font-bold text-primary">{appointmentRef}</p>
              <div className="mt-4 space-y-1 text-sm text-foreground">
                <p><span className="text-muted-foreground">Service:</span> {appt.service_type}</p>
                <p><span className="text-muted-foreground">Date:</span> {appt.date} at {appt.time}</p>
                <p><span className="text-muted-foreground">Vehicle:</span> {vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
            </div>
            <Link to="/" className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium inline-block hover:bg-primary/90 transition-colors">
              Back to Home
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="section-padding pt-28 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="text-overline mb-1">Iowa Auto Trust</p>
            <h1 className="heading-section">Book a Service</h1>
            <p className="text-muted-foreground mt-2">Quick, easy appointment booking</p>
          </div>

          <ProgressBar step={step} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-border p-6"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground mb-4">Your Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={personal.name}
                      onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={personal.phone}
                      onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                      placeholder="(515) 555-0123"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={personal.email}
                      onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground mb-4">Your Vehicle</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Make *</label>
                      <input
                        type="text"
                        value={vehicle.make}
                        onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                        placeholder="Ford"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Model *</label>
                      <input
                        type="text"
                        value={vehicle.model}
                        onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                        placeholder="F-150"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                      <input
                        type="number"
                        value={vehicle.year}
                        onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                        placeholder="2020"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">License Plate</label>
                      <input
                        type="text"
                        value={vehicle.plate}
                        onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                        placeholder="ABC 123"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Color</label>
                    <input
                      type="text"
                      value={vehicle.color}
                      onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                      placeholder="White"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground mb-4">Appointment Details</h2>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Service Type</label>
                    <select
                      value={appt.service_type}
                      onChange={(e) => setAppt({ ...appt, service_type: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {SERVICE_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Preferred Date *</label>
                      <input
                        type="date"
                        value={appt.date}
                        onChange={(e) => setAppt({ ...appt, date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Preferred Time *</label>
                      <input
                        type="time"
                        value={appt.time}
                        onChange={(e) => setAppt({ ...appt, time: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Additional Notes</label>
                    <textarea
                      value={appt.notes}
                      onChange={(e) => setAppt({ ...appt, notes: e.target.value })}
                      rows={3}
                      placeholder="Any special requests or concerns..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground mb-1">Create Your Account</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    To track your appointment online, create a password for <strong>{personal.email}</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={account.password}
                        onChange={(e) => setAccount({ ...account, password: e.target.value })}
                        placeholder="Create a strong password"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-2.5 text-muted-foreground">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {account.password && <PasswordStrength password={account.password} />}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={account.confirm}
                        onChange={(e) => setAccount({ ...account, confirm: e.target.value })}
                        placeholder="Confirm your password"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-2.5 text-muted-foreground">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {account.confirm && account.password !== account.confirm && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                {step > 1 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}
                {step < 4 ? (
                  <button
                    onClick={next}
                    className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Book Appointment
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ServiceBooking;
