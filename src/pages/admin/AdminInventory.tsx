import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { query } from "@/lib/query";
import type { Vehicle, Category } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Loader2,
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
  vin: string;
  discount_amount: string;
  discount_label: string;
  discount_expires: string;
  image_urls: string[];
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
  vin: "",
  discount_amount: "",
  discount_label: "",
  discount_expires: "",
  image_urls: [],
});

const AdminInventory = () => {
  const { user } = useAuth();
  const { bumpVehicleVersion, isDemoModeReady } = useApp();
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"available" | "pending">("available");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: vData }, { data: cData }] = await Promise.all([
        query(() =>
          supabase
            .from("vehicles")
            .select("*, category:categories(id,name)")
            .order("created_at", { ascending: false })
        ),
        query(() => supabase.from("categories").select("*").order("name")),
      ]);
      setVehicles((vData as Vehicle[]) ?? []);
      setCategories((cData as Category[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDemoModeReady) return;
    fetchData();
  }, [isDemoModeReady]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openNew = () => {
    setForm(emptyForm());
    setImageFile(null);
    setImageFiles([]);
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
      vin: v.vin ?? "",
      discount_amount: v.discount_amount ? String(v.discount_amount) : "",
      discount_label: v.discount_label ?? "",
      discount_expires: v.discount_expires ? v.discount_expires.split("T")[0] : "",
      image_urls: v.image_urls ?? (v.image_url ? [v.image_url] : []),
    });
    setImageFile(null);
    setImageFiles([]);
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

  const uploadImages = async (vehicleId: string): Promise<string[]> => {
    const uploaded: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("vehicle-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }
    return uploaded;
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

    const extraFields = {
      vin: form.vin.trim() || null,
      discount_amount: form.discount_amount ? Number(form.discount_amount) : null,
      discount_label: form.discount_label.trim() || null,
      discount_expires: form.discount_expires ? new Date(form.discount_expires).toISOString() : null,
    };

    if (editingId) {
      // Get existing real URLs (not blob:)
      const existingUrls = form.image_urls.filter((u) => !u.startsWith("blob:"));
      let newUrls: string[] = [];
      if (imageFiles.length > 0) {
        setImageUploading(true);
        newUrls = await uploadImages(editingId);
        setImageUploading(false);
      }
      const allUrls = [...existingUrls, ...newUrls];
      const image_url = allUrls[0] ?? form.image_url ?? null;
      const image_urls = allUrls.length > 0 ? allUrls : null;

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
          image_urls,
          ...extraFields,
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

      // Get existing real URLs (not blob:)
      const existingUrls = form.image_urls.filter((u) => !u.startsWith("blob:"));
      let newUrls: string[] = [];
      if (imageFiles.length > 0) {
        setImageUploading(true);
        newUrls = await uploadImages(id);
        setImageUploading(false);
      }
      const allUrls = [...existingUrls, ...newUrls];
      const image_url = allUrls[0] ?? null;
      const image_urls = allUrls.length > 0 ? allUrls : null;

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
        image_urls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...extraFields,
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

  const handleBulkStatus = async () => {
    if (selectedRows.size === 0) return;
    setBulkUpdating(true);
    await supabase.from("vehicles").update({ status: bulkStatus }).in("id", Array.from(selectedRows));
    setSelectedRows(new Set());
    bumpVehicleVersion();
    setBulkUpdating(false);
    fetchData();
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === vehicles.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(vehicles.map((v) => v.id)));
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
                      setField("status", e.target.value as "available" | "pending" | "sold")
                    }
                    className={`${selectClass} mt-1`}
                  >
                    <option value="available">Available</option>
                    <option value="pending">Sale Pending</option>
                    <option value="sold">Sold</option>
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

                {/* VIN */}
                <div className="col-span-2">
                  <Label>VIN (Vehicle Identification Number)</Label>
                  <Input value={form.vin} onChange={(e) => setField("vin", e.target.value)} placeholder="1HGBH41JXMN109186" className="mt-1 font-mono" maxLength={17} />
                </div>

                {/* Discount */}
                <div>
                  <Label>Discount Amount ($)</Label>
                  <Input type="number" value={form.discount_amount} onChange={(e) => setField("discount_amount", e.target.value)} placeholder="500" className="mt-1" />
                </div>
                <div>
                  <Label>Discount Label</Label>
                  <Input value={form.discount_label} onChange={(e) => setField("discount_label", e.target.value)} placeholder="July 4th Sale" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Discount Expires</Label>
                  <Input type="date" value={form.discount_expires} onChange={(e) => setField("discount_expires", e.target.value)} className="mt-1" />
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

                {/* Multi-image upload */}
                <div className="col-span-2">
                  <Label>Vehicle Photos</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">Upload up to 10 photos. First image is the main display photo.</p>
                  {/* Existing images */}
                  {form.image_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.image_urls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="w-20 h-14 rounded-lg object-cover border border-border" />
                          {i === 0 && <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-primary text-primary-foreground px-1 rounded">Main</span>}
                          <button
                            type="button"
                            onClick={() => setField("image_urls", form.image_urls.filter((_, j) => j !== i))}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setImageFiles((prev) => [...prev, ...files].slice(0, 10));
                      files.forEach((file) => {
                        const url = URL.createObjectURL(file);
                        setField("image_urls", [...form.image_urls, url]);
                      });
                    }}
                    className="text-sm"
                  />
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
          <>
            {/* Bulk action bar */}
            {selectedRows.size > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{selectedRows.size} vehicle{selectedRows.size > 1 ? "s" : ""} selected</p>
                <div className="flex items-center gap-3">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as "available" | "pending")}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="available">Set Available</option>
                    <option value="pending">Set Sale Pending</option>
                  </select>
                  <button onClick={handleBulkStatus} disabled={bulkUpdating} className="btn-hero text-xs flex items-center gap-2 h-9 px-4">
                    {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Apply to {selectedRows.size}
                  </button>
                  <button onClick={() => setSelectedRows(new Set())} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="p-4 w-10">
                      <input type="checkbox" checked={selectedRows.size === vehicles.length && vehicles.length > 0} onChange={toggleAll} className="rounded" />
                    </th>
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
                      <td className="p-4 w-10">
                        <input type="checkbox" checked={selectedRows.has(v.id)} onChange={() => toggleRow(v.id)} className="rounded" />
                      </td>
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
                              : v.status === "sold"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {v.status === "available" ? "Available" : v.status === "sold" ? "Sold" : "Pending"}
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
          </>
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
