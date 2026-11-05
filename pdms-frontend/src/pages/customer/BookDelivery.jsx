import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Package,
  Clock3,
  Truck,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";

function BookDelivery() {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Book Delivery</h1>
          <p>Send your parcel quickly and safely</p>
        </div>
      </header>

      <main className="form-page">
        {/* PROGRESS */}
        <div className="booking-progress">
          <div className="progress-step active">
            <span>1</span>
            <p>Route</p>
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <span>2</span>
            <p>Package</p>
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <span>3</span>
            <p>Payment</p>
          </div>
        </div>

        {/* ROUTE CARD */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <MapPin size={21} />
            </div>

            <div>
              <h2>Delivery Route</h2>
              <p>Where should we pick up and deliver?</p>
            </div>
          </div>

          <div className="location-input">
            <div className="location-dot pickup-dot"></div>
            <div>
              <label>Pickup Location</label>
              <input
                type="text"
                placeholder="Enter pickup location"
                value={booking.pickupAddress}
                onChange={(e) => updateBooking({ pickupAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="location-line"></div>

          <div className="location-input">
            <div className="location-dot destination-dot"></div>
            <div>
              <label>Destination</label>
              <input
                type="text"
                placeholder="Enter delivery destination"
                value={booking.dropAddress}
                onChange={(e) => updateBooking({ dropAddress: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* DELIVERY TYPE */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Truck size={21} />
            </div>

            <div>
              <h2>Delivery Type</h2>
              <p>Select how quickly you need it</p>
            </div>
          </div>

          <div className="delivery-options">
            <div
              className={`delivery-option ${booking.deliverySpeed === "EXPRESS" ? "selected" : ""}`}
              onClick={() => updateBooking({ deliverySpeed: "EXPRESS" })}
            >
              <div className="option-icon">
                <Truck size={22} />
              </div>

              <div>
                <strong>Express</strong>
                <span>Fast delivery</span>
              </div>

              {booking.deliverySpeed === "EXPRESS" && (
                <div className="option-check"><Check size={14} aria-hidden="true" /></div>
              )}
            </div>

            <div
              className={`delivery-option ${booking.deliverySpeed === "STANDARD" ? "selected" : ""}`}
              onClick={() => updateBooking({ deliverySpeed: "STANDARD" })}
            >
              <div className="option-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <strong>Standard</strong>
                <span>Economical delivery</span>
              </div>

              {booking.deliverySpeed === "STANDARD" && (
                <div className="option-check"><Check size={14} aria-hidden="true" /></div>
              )}
            </div>
          </div>
        </section>

        {/* PACKAGE PREVIEW */}
        <section
          className="package-mini-card"
          onClick={() => navigate("/customer/package")}
          style={{ cursor: "pointer" }}
        >
          <div className="package-mini-icon">
            <Package size={25} />
          </div>

          <div>
            <strong>Package Details</strong>
            <span>Add package information in the next step</span>
          </div>

          <ChevronRight size={20} />
        </section>

        {/* CONTINUE */}
        <button
          className="continue-btn"
          onClick={() => navigate("/customer/package")}
        >
          Continue
          <ChevronRight size={20} />
        </button>
      </main>
    </div>
  );
}

export default BookDelivery;
