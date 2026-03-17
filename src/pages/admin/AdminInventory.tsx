import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, Vehicle } from "@/data/vehicles";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, X } from "lucide-react";
import Footer from "@/components/Footer";

import car1 from "@/assets/car-1.jpg";

const emptyForm = (): Partial<Vehicle> => ({
  name: "", make: "", model: "", price: 0, mileage: 0, year: 2024, fuel: "Petrol",
  type: "Sedan", seats: 5, engine: "", transmission: "Automatic", description: "",
  features: [],
});

const AdminInventory = () => {
  const { user } = useAuth();
  const { bumpVehicleVersion, vehicleVersion } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Vehicle>>(emptyForm());
  const [featuresText, setFeaturesText] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  // Force re-render
  const [, forceUpdate] = useState(0);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const vehicles = getVehicles();

  const openNew = () => {
    setForm(emptyForm());
    setFeaturesText("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setForm({ ...v });
    setFeaturesText(v.features.join(", "));
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const features = featuresText.split(",").map((f) => f.trim()).filter(Boolean);
    if (editingId) {
      updateVehicle(editingId, { ...form, features });
    } else {
      const mainImage = form.image || car1;
      const images = form.images && form.images.length > 0 ? form.images : [mainImage];
      const newVehicle: Vehicle = {
        ...(form as Vehicle),
        id: crypto.randomUUID(),
        image: mainImage,
        images,
        features,
      };
      addVehicle(newVehicle);
    }
    bumpVehicleVersion();
    setShowForm(false);
    forceUpdate((n) => n + 1);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    deleteVehicle(id);
    bumpVehicleVersion();
    forceUpdate((n) => n + 1);
  };

  const setField = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleImageChange = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    setImageLoading(true);
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (dataUrl) {
        setForm((prev) => ({ ...prev, image: dataUrl, images: [dataUrl] }));
      }
      setImageLoading(false);
    };
    reader.onerror = () => setImageLoading(false);
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-8 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between mb-8">
          <h1 className="heading-section">Inventory Management</h1>
          <button onClick={openNew} className="btn-hero text-xs gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{editingId ? "Edit Vehicle" : "Add Vehicle"}</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                  <Input value={form.name || ""} onChange={(e) => setField("name", e.target.value)} placeholder="BMW 5 Series" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Make</label>
                  <Input value={form.make || ""} onChange={(e) => setField("make", e.target.value)} placeholder="BMW" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Model</label>
                  <Input value={form.model || ""} onChange={(e) => setField("model", e.target.value)} placeholder="5 Series" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Price ($)</label>
                  <Input type="number" value={form.price || ""} onChange={(e) => setField("price", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Mileage</label>
                  <Input type="number" value={form.mileage || ""} onChange={(e) => setField("mileage", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Year</label>
                  <Input type="number" value={form.year || ""} onChange={(e) => setField("year", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Seats</label>
                  <Input type="number" value={form.seats || ""} onChange={(e) => setField("seats", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Fuel</label>
                  <select value={form.fuel || "Petrol"} onChange={(e) => setField("fuel", e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {["Petrol", "Diesel", "Hybrid", "Electric"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
                  <select value={form.type || "Sedan"} onChange={(e) => setField("type", e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {["Sedan", "SUV", "Coupe", "Hatchback"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Engine</label>
                  <Input value={form.engine || ""} onChange={(e) => setField("engine", e.target.value)} placeholder="2.0L Turbo I4" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Transmission</label>
                  <select value={form.transmission || "Automatic"} onChange={(e) => setField("transmission", e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {["Automatic", "Manual", "CVT", "Single-Speed"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => setField("description", e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1 block">Features (comma-separated)</label>
                  <Input value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Leather Interior, Panoramic Roof, ..." />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1 block">Vehicle Image</label>
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="w-44 aspect-[4/3] rounded-xl border border-border overflow-hidden bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                      {form.image ? (
                        <img src={form.image} alt="Vehicle preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>No image selected</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleImageChange(e.target.files?.[0])}
                        disabled={imageLoading}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload or capture an image for this vehicle. The first image is used across listings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="px-6 py-2 text-sm font-medium border border-border rounded-lg">Cancel</button>
                <button onClick={handleSave} className="btn-hero text-xs">{editingId ? "Update" : "Add"} Vehicle</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="section-padding pb-24">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Year</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Fuel</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={v.image} alt={v.name} className="w-12 h-8 rounded object-cover" />
                      <span className="font-medium text-foreground">{v.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-foreground">${v.price.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{v.year}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{v.type}</td>
                  <td className="p-4 text-muted-foreground hidden lg:table-cell">{v.fuel}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminInventory;
