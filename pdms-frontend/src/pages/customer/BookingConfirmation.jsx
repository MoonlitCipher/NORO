import {
  CheckCircle,
  Package,
  CreditCard,
  Truck,
  Navigation,
  Home,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";

function BookingConfirmation() {
  const navigate = useNavigate();
  const { booking } = useBooking();

  const trackingNumber = booking.order?.trackingNumber || "PDMS-10246";
  const pickup = booking.order?.pickupAddress?.split(",")[0] || booking.pickupAddress?.split(",")[0] || "Parvathipuram";
  const drop = booking.order?.dropAddress?.split(",")[0] || booking.dropAddress?.split(",")[0] || "Nagercoil";
  const fare = booking.order ? booking.order.fareTotalPaise / 100 : (booking.quote ? booking.quote.totalFareRupees : 160);
  const pkgType = booking.packageType?.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "Small Parcel";
  const weight = booking.packageWeightKg || 1;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="confirmation-header">
        <div className="success-icon">
          <CheckCircle size={52} />
        </div>

        <h1>Booking Confirmed!</h1>
        <p>Your parcel delivery has been successfully booked.</p>
      </header>

      <main className="confirmation-page">
        {/* BOOKING ID */}
        <section className="booking-id-card">
          <span>Booking ID</span>
          <strong>{trackingNumber}</strong>
          <small>Keep this ID for tracking your delivery</small>
        </section>

        {/* DELIVERY SUMMARY */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Truck size={21} />
            </div>

            <div>
              <h2>Delivery Summary</h2>
              <p>Your parcel is scheduled for pickup</p>
            </div>
          </div>

          <div className="confirmation-route">
            <div className="confirmation-point">
              <span className="location-dot pickup-dot"></span>
              <div>
                <small>Pickup Location</small>
                <strong>{pickup}</strong>
              </div>
            </div>

            <div className="confirmation-line"></div>

            <div className="confirmation-point">
              <span className="location-dot destination-dot"></span>
              <div>
                <small>Destination</small>
                <strong>{drop}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* PACKAGE */}
        <section className="confirmation-info-card">
          <div className="confirmation-info-icon">
            <Package size={22} />
          </div>

          <div>
            <span>Package</span>
            <strong>{pkgType} • {weight} KG</strong>
          </div>
        </section>

        {/* PAYMENT */}
        <section className="confirmation-info-card">
          <div className="confirmation-info-icon">
            <CreditCard size={22} />
          </div>

          <div>
            <span>Payment</span>
            <strong>Paid • ₹{fare}</strong>
          </div>
        </section>

        {/* DRIVER STATUS */}
        <section className="driver-status-card">
          <div className="driver-status-icon">
            <Navigation size={24} />
          </div>

          <div>
            <strong>Delivery in Progress</strong>
            <span>
              Follow your order in real time on the live tracking screen.
            </span>
          </div>
        </section>

        {/* TRACK */}
        <button
          className="continue-btn"
          onClick={() => navigate(`/customer/track?id=${trackingNumber}`)}
        >
          Track Delivery
          <ArrowRight size={20} />
        </button>

        {/* HOME */}
        <button
          className="home-outline-btn"
          onClick={() => navigate("/customer")}
        >
          <Home size={18} />
          Back to Home
        </button>

        {/* ORDERS */}
        <button
          className="orders-link-btn"
          onClick={() => navigate("/customer/orders")}
        >
          <ClipboardList size={17} />
          View My Orders
        </button>
      </main>
    </div>
  );
}

export default BookingConfirmation;
