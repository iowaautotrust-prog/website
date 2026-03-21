import { useState, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UploadCloud,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

// CSV template columns
const TEMPLATE_COLUMNS = [
  "name",
  "make",
  "model",
  "year",
  "price",
  "mileage",
  "fuel",
  "type",
  "seats",
  "engine",
  "transmission",
  "description",
  "features",
  "status",
];

interface ParsedVehicle {
  name: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  type: string;
  seats: number;
  engine: string;
  transmission: string;
  description: string;
  features: string[];
  status: "available" | "pending";
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_COLUMNS,
    [
      "Honda Civic LX",
      "Honda",
      "Civic",
      2021,
      18500,
      34000,
      "Petrol",
      "Sedan",
      5,
      "1.5L Turbo",
      "Automatic",
      "Clean one-owner vehicle with full service records.",
      "Backup Camera, Apple CarPlay, Lane Assist",
      "available",
    ],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
  XLSX.writeFile(wb, "iowa-auto-trust-import-template.xlsx");
};

const parseRow = (row: Record<string, unknown>): ParsedVehicle | null => {
  const name = String(row.name ?? "").trim();
  const make = String(row.make ?? "").trim();
  if (!name || !make) return null;

  const features = String(row.features ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const rawStatus = String(row.status ?? "available").toLowerCase().trim();
  const status: "available" | "pending" =
    rawStatus === "pending" ? "pending" : "available";

  return {
    name,
    make,
    model: String(row.model ?? "").trim(),
    year: Number(row.year) || new Date().getFullYear(),
    price: Number(row.price) || 0,
    mileage: Number(row.mileage) || 0,
    fuel: String(row.fuel ?? "Petrol").trim(),
    type: String(row.type ?? "Sedan").trim(),
    seats: Number(row.seats) || 5,
    engine: String(row.engine ?? "").trim(),
    transmission: String(row.transmission ?? "Automatic").trim(),
    description: String(row.description ?? "").trim(),
    features,
    status,
  };
};

export default function AdminImport() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedVehicle[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const handleFile = (file: File) => {
    setParseError(null);
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        });
        const vehicles = rows
          .map(parseRow)
          .filter((v): v is ParsedVehicle => v !== null);
        if (vehicles.length === 0) {
          setParseError(
            "No valid rows found. Make sure your file has the correct columns."
          );
          setParsed([]);
          return;
        }
        setParsed(vehicles);
      } catch {
        setParseError("Could not read file. Please use the provided template.");
        setParsed([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    // Batch insert in chunks of 20
    const CHUNK = 20;
    const now = new Date().toISOString();
    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK).map((v) => ({
        ...v,
        view_count: 0,
        in_carousel: false,
        image_url: null,
        image_urls: null,
        category_id: null,
        created_at: now,
        updated_at: now,
      }));
      const { error } = await supabase.from("vehicles").insert(chunk);
      if (error) {
        failed += chunk.length;
        errors.push(`Rows ${i + 1}–${i + chunk.length}: ${error.message}`);
      } else {
        success += chunk.length;
      }
    }

    setResult({ success, failed, errors });
    setImporting(false);
    if (success > 0) setParsed([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="section-padding pt-10 pb-24">
        <Link
          to="/admin/inventory"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <p className="text-overline mb-1">Admin</p>
          <h1 className="heading-section mb-2">Bulk Import Vehicles</h1>
          <p className="text-muted-foreground mb-10">
            Upload a CSV or Excel file to add multiple vehicles at once. Images
            can be added later from the Inventory page.
          </p>

          {/* Download Template */}
          <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-secondary/40 mb-8">
            <FileSpreadsheet className="w-8 h-8 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Download Template</p>
              <p className="text-sm text-muted-foreground mb-3">
                Use our Excel template to format your data correctly. Required
                columns: name, make, price. All others are optional.
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> Download Template (.xlsx)
              </Button>
            </div>
          </div>

          {/* Template columns reference */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Expected Columns
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_COLUMNS.map((col) => (
                <span
                  key={col}
                  className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">
              {fileName ? fileName : "Drop your file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse — .xlsx, .xls, .csv supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {parseError && (
            <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          {/* Preview table */}
          {parsed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">
                  Preview — {parsed.length} vehicle
                  {parsed.length !== 1 ? "s" : ""} ready to import
                </p>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-hero text-xs flex items-center gap-2"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {importing ? "Importing…" : `Import ${parsed.length} Vehicles`}
                </Button>
              </div>
              <div className="rounded-xl border border-border overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Make</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Year</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Price</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Mileage</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 50).map((v, i) => (
                      <tr
                        key={i}
                        className="border-t border-border hover:bg-secondary/40 transition-colors"
                      >
                        <td className="p-3 font-medium">{v.name}</td>
                        <td className="p-3 text-muted-foreground">{v.make}</td>
                        <td className="p-3 text-muted-foreground">{v.year}</td>
                        <td className="p-3 text-foreground">
                          ${v.price.toLocaleString()}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {v.mileage.toLocaleString()} mi
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              v.status === "available"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing first 50 of {parsed.length} rows
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              {result.success > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 text-green-700">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {result.success} vehicle
                      {result.success !== 1 ? "s" : ""} imported successfully!
                    </p>
                    <p className="text-sm mt-1">
                      Go to{" "}
                      <Link to="/admin/inventory" className="underline font-medium">
                        Inventory
                      </Link>{" "}
                      to add images to the imported vehicles.
                    </p>
                  </div>
                </div>
              )}
              {result.failed > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {result.failed} vehicle
                      {result.failed !== 1 ? "s" : ""} failed to import.
                    </p>
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs mt-1">
                        {e}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
