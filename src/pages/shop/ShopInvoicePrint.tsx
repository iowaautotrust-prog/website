import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { ShopInvoice, ServiceItem } from "@/lib/shopTypes";
import { Loader2, Printer } from "lucide-react";

const ShopInvoicePrint = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<ShopInvoice | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: inv }, { data: its }] = await Promise.all([
        supabase.from("shop_invoices" as any)
          .select("*, customer:shop_customers(name,phone,email,address), job:service_jobs(job_number,mileage_in,mileage_out,next_service_date,next_service_mileage,vehicle:shop_vehicles(make,model,year,plate,color,vin))")
          .eq("id", id).single(),
        supabase.from("service_items" as any).select("*").eq("job_id",
          (await supabase.from("shop_invoices" as any).select("job_id").eq("id", id).single()).data?.job_id ?? ""
        ).order("created_at"),
      ]);
      setInvoice(inv as unknown as ShopInvoice);
      setItems((its as unknown as ServiceItem[]) ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  if (!invoice) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Invoice not found.</p>
    </div>
  );

  const customer = (invoice as any).customer;
  const job = (invoice as any).job;
  const vehicle = job?.vehicle;

  const dueDate = new Date(invoice.created_at);
  dueDate.setDate(dueDate.getDate() + 30);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto p-8 bg-white min-h-screen font-sans text-gray-900">
        {/* Print button */}
        <div className="no-print flex justify-end mb-6">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Iowa Auto Trust</h1>
            <p className="text-sm text-gray-500 mt-0.5">Woodward, Iowa</p>
            <p className="text-sm text-gray-600 mt-2">(515) 672-5406</p>
            <p className="text-sm text-gray-600">iowaautotrust@gmail.com</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-gray-900 uppercase tracking-tight">Invoice</p>
            <p className="text-lg font-mono font-bold text-gray-700 mt-1">#{invoice.invoice_number}</p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
              <p><span className="font-semibold text-gray-900">Due:</span> {dueDate.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Bill To + Vehicle */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
            {customer ? (
              <div className="text-sm space-y-0.5">
                <p className="font-bold text-gray-900 text-base">{customer.name}</p>
                {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                {customer.email && <p className="text-gray-600">{customer.email}</p>}
                {customer.address && <p className="text-gray-600">{customer.address}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">N/A</p>
            )}
          </div>
          {vehicle && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Vehicle</p>
              <div className="text-sm space-y-0.5">
                <p className="font-bold text-gray-900 text-base">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                {vehicle.color && <p className="text-gray-600">Color: {vehicle.color}</p>}
                {vehicle.plate && <p className="text-gray-600">Plate: {vehicle.plate}</p>}
                {vehicle.vin && <p className="text-gray-600">VIN: {vehicle.vin}</p>}
                {job?.mileage_in && <p className="text-gray-600">Mileage In: {job.mileage_in.toLocaleString()}</p>}
                {job?.mileage_out && <p className="text-gray-600">Mileage Out: {job.mileage_out.toLocaleString()}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-900">Service</th>
                <th className="py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-900 hidden sm:table-cell">Details</th>
                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-900">Qty</th>
                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-900">Unit Price</th>
                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                  <td className="py-2.5 text-sm font-medium text-gray-900">{item.service_type}</td>
                  <td className="py-2.5 text-sm text-gray-500 hidden sm:table-cell">{item.oil_type ?? "—"}</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right">{item.quantity ?? 1} {item.unit}</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right">${item.unit_price.toFixed(2)}</td>
                  <td className="py-2.5 text-sm font-semibold text-gray-900 text-right">${((item.quantity ?? 1) * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-sm text-gray-400">No items</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({(invoice.tax_rate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-gray-900">${invoice.tax_amount.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">−${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-gray-900">
              <span className="text-base font-black text-gray-900 uppercase tracking-wide">Total</span>
              <span className="text-xl font-black text-gray-900">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment status */}
        <div className="flex items-center justify-between mb-8 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Payment Status</p>
            {invoice.payment_method && <p className="text-gray-600">Method: {invoice.payment_method}</p>}
            {invoice.paid_at && <p className="text-gray-600">Paid on: {new Date(invoice.paid_at).toLocaleDateString()}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${invoice.paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {invoice.paid ? "PAID" : "UNPAID"}
          </span>
        </div>

        {/* Next service reminder */}
        {(job?.next_service_date || job?.next_service_mileage) && (
          <div className="mb-8 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <p className="text-sm font-semibold text-blue-900">Next Service Reminder</p>
            <p className="text-sm text-blue-700 mt-0.5">
              {job.next_service_date && `Return by ${new Date(job.next_service_date).toLocaleDateString()}`}
              {job.next_service_date && job.next_service_mileage && " or "}
              {job.next_service_mileage && `at ${job.next_service_mileage.toLocaleString()} miles`}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-base font-semibold text-gray-900">Thank you for choosing Iowa Auto Trust!</p>
          <p className="text-sm text-gray-500 mt-1">Questions? Call us at (515) 672-5406 or email iowaautotrust@gmail.com</p>
        </div>
      </div>
    </>
  );
};

export default ShopInvoicePrint;
