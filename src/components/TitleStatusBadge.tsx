import { ShieldCheck } from "lucide-react";

/** "Clean" -> "Clean Title", "Rebuilt" -> "Rebuilt Title": exactly what was entered in the Title Status field. */
const titleStatusText = (value: string): string => (/title/i.test(value) ? value : `${value} Title`);

interface Props {
  value?: string | null;
  className?: string;
}

// Shown on inventory cards and the vehicle page header. Nothing is shown until the field is filled in.
const TitleStatusBadge = ({ value, className = "" }: Props) => {
  const v = (value ?? "").trim();
  if (!v) return null;
  const tone = /^clean/i.test(v)
    ? "bg-green-100 text-green-800 border-green-300"
    : /rebuilt|salvage|branded/i.test(v)
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : "bg-secondary text-foreground border-border";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone} ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {titleStatusText(v)}
    </span>
  );
};

export default TitleStatusBadge;
