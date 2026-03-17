import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";
import { Vehicle } from "@/data/vehicles";

interface Props {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
}

const InterestDialog = ({ vehicle, open, onClose }: Props) => {
  const { user } = useAuth();
  const { addLead } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState(`I'm interested in the ${vehicle.name}.`);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLead({
      userId: user?.id,
      userName: name,
      userEmail: email,
      userPhone: phone,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      message,
    });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-2xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Inquiry Submitted!</h3>
                <p className="text-muted-foreground">We'll be in touch shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Express Interest</h2>
                    <p className="text-sm text-muted-foreground">{vehicle.name}</p>
                  </div>
                  <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-hero w-full justify-center">Submit Inquiry</button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterestDialog;
