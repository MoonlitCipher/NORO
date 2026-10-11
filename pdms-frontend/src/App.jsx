import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import ParticleBackground from "./components/ParticleBackground";
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";

// Landing
import Landing from "./pages/landing/Landing";

// Customer Auth & Flow
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerRegister from "./pages/auth/CustomerRegister";
import CustomerHome from "./pages/customer/CustomerHome";
import BookDelivery from "./pages/customer/BookDelivery";
import PackageDetails from "./pages/customer/PackageDetails";
import FareEstimate from "./pages/customer/FareEstimate";
import Payment from "./pages/customer/Payment";
import BookingConfirmation from "./pages/customer/BookingConfirmation";
import TrackDelivery from "./pages/customer/TrackDelivery";
import Orders from "./pages/customer/Orders";
import OrderDetails from "./pages/customer/OrderDetails";
import Profile from "./pages/customer/Profile";
import Notifications from "./pages/customer/Notifications";
import Addresses from "./pages/customer/Addresses";

// Partner Portal
import PartnerLogin from "./pages/auth/PartnerLogin";
import PartnerRegister from "./pages/auth/PartnerRegister";
import PartnerHome from "./pages/partner/PartnerHome";
import DeliveryRequests from "./pages/partner/DeliveryRequests";
import ActiveDelivery from "./pages/partner/ActiveDelivery";
import Earnings from "./pages/partner/Earnings";
import DeliveryHistory from "./pages/partner/DeliveryHistory";
import KYC from "./pages/partner/KYC";

// Admin Operations
import AdminLogin from "./pages/auth/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartners from "./pages/admin/Partners";
import AdminOrders from "./pages/admin/Orders";
import AdminLiveTracking from "./pages/admin/LiveTracking";
import AdminPricing from "./pages/admin/Pricing";
import AdminSettlements from "./pages/admin/Settlements";

/* Bright particle backdrop on every page except the landing hero (which has its own video) */
function Backdrop() {
  const { pathname } = useLocation();
  const show = pathname !== "/";

  useEffect(() => {
    document.body.classList.toggle("has-particles", show);
    return () => document.body.classList.remove("has-particles");
  }, [show]);

  return show ? <ParticleBackground /> : null;
}

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <Backdrop />

          <Routes>
            {/* Landing */}
            <Route path="/" element={<Landing />} />

            {/* Customer Routes */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer" element={<CustomerHome />} />
            <Route path="/customer/book" element={<BookDelivery />} />
            <Route path="/customer/package" element={<PackageDetails />} />
            <Route path="/customer/fare" element={<FareEstimate />} />
            <Route path="/customer/payment" element={<Payment />} />
            <Route path="/customer/confirmation" element={<BookingConfirmation />} />
            <Route path="/customer/track" element={<TrackDelivery />} />
            <Route path="/customer/orders" element={<Orders />} />
            <Route path="/customer/order/:id" element={<OrderDetails />} />
            <Route path="/customer/profile" element={<Profile />} />
            <Route path="/customer/notifications" element={<Notifications />} />
            <Route path="/customer/addresses" element={<Addresses />} />

            {/* Partner Routes */}
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/partner/register" element={<PartnerRegister />} />
            <Route path="/partner" element={<PartnerHome />} />
            <Route path="/partner/requests" element={<DeliveryRequests />} />
            <Route path="/partner/active" element={<ActiveDelivery />} />
            <Route path="/partner/earnings" element={<Earnings />} />
            <Route path="/partner/history" element={<DeliveryHistory />} />
            <Route path="/partner/kyc" element={<KYC />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/partners" element={<AdminPartners />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/tracking" element={<AdminLiveTracking />} />
            <Route path="/admin/pricing" element={<AdminPricing />} />
            <Route path="/admin/settlements" element={<AdminSettlements />} />
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;