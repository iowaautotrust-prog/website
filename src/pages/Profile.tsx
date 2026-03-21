import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Clock,
  Search,
  User,
  Pencil,
  X,
  Check,
  Shield,
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { favorites, recentViews, recentSearches, toggleFavorite } = useApp();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [tab, setTab] = useState<"saved" | "views" | "searches">("saved");

  if (!user) return <Navigate to="/login" />;

  const startEdit = () => {
    setForm({ name: user.name ?? "", phone: user.phone ?? "", location: user.location ?? "" });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
    setEditing(false);
  };

  const tabs = [
    { key: "saved" as const, label: "Saved Cars", icon: Heart, count: favorites.length },
    { key: "views" as const, label: "Recently Viewed", icon: Clock, count: recentViews.length },
    { key: "searches" as const, label: "Searches", icon: Search, count: recentSearches.length },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="section-padding pt-28">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="section-padding pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {user.name}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {!editing ? (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-70"
                  >
                    <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
              <button
                onClick={() => logout()}
                className="px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 p-6 rounded-xl bg-secondary"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Iowa, USA"
                />
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Saved Cars */}
          {tab === "saved" && (
            <div className="space-y-4">
              {favorites.length === 0 ? (
                <p className="text-body text-center py-16">
                  No saved vehicles yet.{" "}
                  <Link to="/inventory" className="text-primary hover:underline">
                    Browse inventory
                  </Link>{" "}
                  to save favorites.
                </p>
              ) : (
                recentViews
                  .filter((v) => favorites.includes(v.id))
                  .concat(
                    // vehicles in favorites but not in recentViews — just show from recentViews for now
                    []
                  )
                  .map((car) => (
                    <div
                      key={car.id}
                      className="card-cinematic flex flex-col sm:flex-row group"
                    >
                      <Link
                        to={`/vehicle/${car.id}`}
                        className="sm:w-1/3 aspect-video sm:aspect-auto overflow-hidden"
                      >
                        {car.image_url ? (
                          <img
                            src={car.image_url}
                            alt={car.name}
                            className="card-image w-full h-full object-cover sm:h-48"
                          />
                        ) : (
                          <div className="w-full h-48 bg-secondary" />
                        )}
                      </Link>
                      <div className="sm:w-2/3 p-6 flex items-center justify-between">
                        <Link to={`/vehicle/${car.id}`}>
                          <p className="text-xs text-muted-foreground mb-1">
                            {car.year} · {car.type}
                          </p>
                          <h3 className="text-lg font-bold text-foreground">
                            {car.name}
                          </h3>
                          <p className="text-xl font-bold text-primary mt-1">
                            ${car.price.toLocaleString()}
                          </p>
                        </Link>
                        <div className="flex gap-3 items-center">
                          <button
                            onClick={() => toggleFavorite(car.id)}
                            className="p-2 rounded-full hover:bg-secondary transition-colors"
                            aria-label="Remove from saved"
                          >
                            <Heart className="w-5 h-5 text-destructive fill-destructive" />
                          </button>
                          <Link
                            to={`/vehicle/${car.id}`}
                            className="flex items-center gap-1 text-sm text-primary font-medium"
                          >
                            View <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Recently Viewed */}
          {tab === "views" && (
            <div className="space-y-4">
              {recentViews.length === 0 ? (
                <p className="text-body text-center py-16">
                  No recently viewed vehicles.
                </p>
              ) : (
                recentViews.slice(0, 10).map((car) => (
                  <Link
                    key={car.id}
                    to={`/vehicle/${car.id}`}
                    className="card-cinematic flex flex-col sm:flex-row group"
                  >
                    <div className="sm:w-1/3 aspect-video sm:aspect-auto overflow-hidden">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={car.name}
                          className="card-image w-full h-full object-cover sm:h-40"
                        />
                      ) : (
                        <div className="w-full h-40 bg-secondary" />
                      )}
                    </div>
                    <div className="sm:w-2/3 p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {car.year} · {car.type}
                        </p>
                        <h3 className="text-lg font-bold text-foreground">
                          {car.name}
                        </h3>
                        <p className="text-xl font-bold text-primary mt-1">
                          ${car.price.toLocaleString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Recent Searches */}
          {tab === "searches" && (
            <div className="space-y-2">
              {recentSearches.length === 0 ? (
                <p className="text-body text-center py-16">No recent searches.</p>
              ) : (
                recentSearches.map((q, i) => (
                  <Link
                    key={i}
                    to={`/inventory?search=${encodeURIComponent(q)}`}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{q}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
