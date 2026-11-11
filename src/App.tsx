import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

// Pages
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import VehicleDetail from "./pages/VehicleDetail";
import Compare from "./pages/Compare";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import CookieBanner from "@/components/CookieBanner";
import ScrollToTop from "@/components/ScrollToTop";
import RouteAnalytics from "@/components/RouteAnalytics";
import RobotsGuard from "@/components/RobotsGuard";

// Everything below is loaded on demand so the public pages ship a much smaller JS bundle.
// Auth
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Profile = lazy(() => import("./pages/Profile"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminImport = lazy(() => import("./pages/admin/AdminImport"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminDiscounts = lazy(() => import("./pages/admin/AdminDiscounts"));
const AdminQuiz = lazy(() => import("./pages/admin/AdminQuiz"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));

// Shop pages
const ShopDashboard = lazy(() => import("./pages/shop/ShopDashboard"));
const ShopCustomers = lazy(() => import("./pages/shop/ShopCustomers"));
const ShopCustomerDetail = lazy(() => import("./pages/shop/ShopCustomerDetail"));
const ShopJobs = lazy(() => import("./pages/shop/ShopJobs"));
const ShopJobDetail = lazy(() => import("./pages/shop/ShopJobDetail"));
const ShopAppointments = lazy(() => import("./pages/shop/ShopAppointments"));
const ShopInvoices = lazy(() => import("./pages/shop/ShopInvoices"));
const ShopInvoicePrint = lazy(() => import("./pages/shop/ShopInvoicePrint"));
const ShopInventory = lazy(() => import("./pages/shop/ShopInventory"));
const ShopReports = lazy(() => import("./pages/shop/ShopReports"));

// Service pages
const ServiceBooking = lazy(() => import("./pages/service/ServiceBooking"));
const JobTracker = lazy(() => import("./pages/service/JobTracker"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

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
            <RouteAnalytics />
            <RobotsGuard />
            <Suspense fallback={<PageLoader />}>
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
              <Route path="/reset-password" element={<ResetPassword />} />
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
              <Route path="/admin/quiz" element={<AdminQuiz />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />

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
            </Suspense>
            <CookieBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
