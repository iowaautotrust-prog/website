import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

// Pages
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import VehicleDetail from "./pages/VehicleDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import Compare from "./pages/Compare";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import CookieBanner from "@/components/CookieBanner";
import ScrollToTop from "@/components/ScrollToTop";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminImport from "./pages/admin/AdminImport";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDiscounts from "./pages/admin/AdminDiscounts";

// Shop pages
import ShopDashboard from "./pages/shop/ShopDashboard";
import ShopCustomers from "./pages/shop/ShopCustomers";
import ShopCustomerDetail from "./pages/shop/ShopCustomerDetail";
import ShopJobs from "./pages/shop/ShopJobs";
import ShopJobDetail from "./pages/shop/ShopJobDetail";
import ShopAppointments from "./pages/shop/ShopAppointments";
import ShopInvoices from "./pages/shop/ShopInvoices";
import ShopInvoicePrint from "./pages/shop/ShopInvoicePrint";
import ShopInventory from "./pages/shop/ShopInventory";
import ShopReports from "./pages/shop/ShopReports";

// Service pages
import ServiceBooking from "./pages/service/ServiceBooking";
import JobTracker from "./pages/service/JobTracker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/vehicle/:id" element={<VehicleDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/import" element={<AdminImport />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/discounts" element={<AdminDiscounts />} />

              {/* Shop */}
              <Route path="/shop" element={<ShopDashboard />} />
              <Route path="/shop/customers" element={<ShopCustomers />} />
              <Route path="/shop/customers/:id" element={<ShopCustomerDetail />} />
              <Route path="/shop/jobs" element={<ShopJobs />} />
              <Route path="/shop/jobs/:id" element={<ShopJobDetail />} />
              <Route path="/shop/appointments" element={<ShopAppointments />} />
              <Route path="/shop/invoices" element={<ShopInvoices />} />
              <Route path="/shop/invoices/:id/print" element={<ShopInvoicePrint />} />
              <Route path="/shop/inventory" element={<ShopInventory />} />
              <Route path="/shop/reports" element={<ShopReports />} />

              {/* Service (public booking / tracker) */}
              <Route path="/service" element={<ServiceBooking />} />
              <Route path="/service/track" element={<JobTracker />} />
              <Route path="/service/track/:jobNumber" element={<JobTracker />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
