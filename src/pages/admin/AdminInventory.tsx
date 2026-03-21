import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import type { Vehicle, Category } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Loader2,
  UploadCloud,
  Eye,
} from "lucide-react";
import Footer from "@/components/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FormState = {
  name: string;
  make: string;
  model: string;
  price: number;
  mileage: number;
  year: number;
  fuel: string;
  type: string;
  category_id: string;
  seats: number;
  engine: string;
  transmission: string;
  description: string;
  features: string;
  status: "available" | "pending";
  in_carousel: boolean;
  image_url: string;
};

const emptyForm = (): FormState => ({
  name: "",
  make: "",
  model: "",
  price: 0,
  mileage: 0,
  year: new Date().getFullYear(),
  fuel: "Petrol",
  type: "Sedan",
  category_id: "",
  seats: 5,
  engine: "",
  transmission: "Automatic",
  description: "",
  features: "",
  status: "available",
  in_carousel: false,
  image_url: "",
});

const AdminInventory = () => {
  const { user } = useAuth();
  const { bumpVehicleVersion } = useApp();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const fetchData = async () => {
    setLoading(true);
    const [{ data: vData }, { data: cData }] = await Promise.all([
      supabase
        .from("vehicles")
        .select("*, category:categories(id,name)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setVehicles((vData as Vehicle[]) ?? []);
    setCategories((cData as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openNew = () => {
    setForm(emptyForm());
    setImageFile(null);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setForm({
      name: v.name,
      make: v.make,
      model: v.model,
      price: v.price,
      mileage: v.mileage,
      year: v.year,
      fuel: v.fuel,
      type: v.type,
      category_id: v.category_id ?? "",
      seats: v.seats ?? 5,
      engine: v.engine ?? "",
      transmission: v.transmission ?? "Automatic",
      description: v.description ?? "",
      features: (v.features ?? []).join(", "),
      status: v.status,
      in_carousel: v.in_carousel,
      image_url: v.image_url ?? "",
    });
    setImageFile(null);
    setEditingId(v.id);
    setFormError(null);
    setShowForm(true);
  };

  const uploadImage = async (vehicleId: string): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `${vehicleId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("vehicle-images")
      .upload(path, imageFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage
      .from("vehicle-images")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.make.trim() || !form.price) {
      setFormError("Name, Make, and Price are required.");
      return;
    }
    setSaving(true);
    setFormError(null);

    const features = form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingId) {
      // Upload new image if provided
      let image_url = form.image_url;
      if (imageFile) {
        setImageUploading(true);
        const url = await uploadImage(editingId);
        if (url) image_url = url;
        setImageUploading(false);
      }
      const { error } = await supabase
        .from("vehicles")
        .update({
          name: form.name,
          make: form.make,
          model: form.model,
          price: form.price,
          mileage: form.mileage,
          year: form.year,
          fuel: form.fuel,
          type: form.type,
          category_id: form.category_id || null,
          seats: form.seats,
          engine: form.engine || null,
          transmission: form.transmission,
          description: form.description || null,
          features,
          status: form.status,
          in_carousel: form.in_carousel,
          image_url,
          image_urls: image_url ? [image_url] : null,
        })
        .eq("id", editingId);
      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    } else {
      // Create new vehicle
      const id = crypto.randomUUID();
      let image_url: string | null = null;
      if (imageFile) {
        setImageUploading(true);
        image_url = await uploadImage(id);
        setImageUploading(false);
      }
      const { error } = await supabase.from("vehicles").insert({
        id,
        name: form.name,
        make: form.make,
        model: form.model,
        price: form.price,
        mileage: form.mileage,
        year: form.year,
        fuel: form.fuel,
        type: form.type,
        category_id: form.category_id || null,
        seats: form.seats,
        engine: form.engine || null,
        transmission: form.transmission,
        description: form.description || null,
        features,
        status: form.status,
        in_carousel: form.in_carousel,
        view_count: 0,
        image_url,
        image_urls: image_url ? [image_url] : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setFormError(error.message);
        setSaving(false);
        return;
      }
    }

    bumpVehicleVersion();
    setSaving(false);
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("vehicles").delete().eq("id", deleteId);
    bumpVehicleVersion();
    setDeleteId(null);
    fetchData();
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-overline mb-1">Admin</p>
            <h1 className="heading-section">Inventory Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/import" className="btn-hero-outline text-xs">
              CSV Import
            </Link>
            <button onClick={openNew} className="btn-hero text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl p-8 w-full max-w-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Vehicle" : "Add Vehicle"}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="BMW 5 Series"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Make *</Label>
                  <Input
                    value={form.make}
                    onChange={(e) => setField("make", e.target.value)}
                    placeholder="BMW"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={form.model}
                    onChange={(e) => setField("model", e.target.value)}
                    placeholder="5 Series"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    value={form.price || ""}
                    onChange={(e) => setField("price", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Mileage</Label>
                  <Input
                    type="number"
                    value={form.mileage || ""}
                    onChange={(e) => setField("mileage", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => setField("year", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Seats</Label>
                  <Input
                    type="number"
                    value={form.seats}
                    onChange={(e) => setField("seats", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Fuel</Label>
                  <select
                    value={form.fuel}
                    onChange={(e) => setField("fuel", e.target.value)}
                    className={`${selectClass} mt-1`}
                  >
                    {["Petrol", "Diesel", "Hybrid", "Electric"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className={`${selectClass} mt-1`}
                  >
                    {["Sedan", "SUV", "Coupe", "Hatchback", "Truck", "Van", "Wagon", "Convertible"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setField("category_id", e.target.value)}
                    className={`${selectClass} mt-1`}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setField("status", e.target.value as "available" | "pending")
                    }
                    className={`${selectClass} mt-1`}
                  >
                    <option value="available">Available</option>
                    <option value="pending">Sale Pending</option>
                  </select>
                </div>
                <div>
                  <Label>Engine</Label>
                  <Input
                    value={form.engine}
                    onChange={(e) => setField("engine", e.target.value)}
                    placeholder="2.0L Turbo I4"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Transmission</Label>
                  <select
                    value={form.transmission}
                    onChange={(e) => setField("transmission", e.target.value)}
                    className={`${selectClass} mt-1`}
                  >
                    {["Automatic", "Manual", "CVT", "Single-Speed"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] mt-1 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Brief description of the vehicle..."
                  />
                </div>
                <div className="col-span-2">
                  <Label>Features (comma-separated)</Label>
                  <Input
                    value={form.features}
                    onChange={(e) => setField("features", e.target.value)}
                    placeholder="Leather Interior, Panoramic Roof, ..."
                    className="mt-1"
                  />
                </div>

                {/* In Carousel toggle */}
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        form.in_carousel ? "bg-primary" : "bg-muted"
                      }`}
                      onClick={() => setField("in_carousel", !form.in_carousel)}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          form.in_carousel ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-primary" />
                        Feature in Hero Carousel
                      </span>
                      <p className="text-xs text-muted-foreground">
                        This vehicle will appear in the homepage spotlight
                      </p>
                    </div>
                  </label>
                </div>

                {/* Image upload */}
                <div className="col-span-2">
                  <Label>Vehicle Image</Label>
                  <div className="flex gap-4 items-start mt-2">
                    <div className="w-40 aspect-video rounded-xl border border-border overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                      {form.image_url ? (
                        <img
                          src={form.image_url}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UploadCloud className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setField("image_url", URL.createObjectURL(file));
                          }
                        }}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload a JPG or PNG. Image will be stored on Supabase CDN.
                        {editingId && " Leave blank to keep current image."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-destructive mt-4">{formError}</p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || imageUploading}
                  className="btn-hero text-xs flex items-center gap-2"
                >
                  {(saving || imageUploading) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editingId ? "Update" : "Add"} Vehicle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="section-padding pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Vehicle
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                    Views
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">
                    Carousel
                  </th>
                  <th className="text-right p-4 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="border-t border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.name}
                            className="w-12 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-8 rounded bg-secondary flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">–</span>
                          </div>
                        )}
                        <span className="font-medium text-foreground">{v.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-foreground font-medium">
                      ${v.price.toLocaleString()}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {v.status === "available" ? "Available" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {v.view_count}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {v.in_carousel && (
                        <Star className="w-4 h-4 text-primary fill-primary" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setDeleteId(v.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the vehicle from inventory. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default AdminInventory;
