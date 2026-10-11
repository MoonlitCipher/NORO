import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  CreditCard,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { pricingApi } from "../../api/client";

function FareEstimate() {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState(booking.quote || null);

  useEffect(() => {
    async function fetchQuote() {
      setLoading(true);
      setError("");
      try {
        const res = await pricingApi.getQuote({
          pickupAddress: booking.pickupAddress,
          dropAddress: booking.dropAddress,
          pickupLat: booking.pickupLat,
          pickupLng: booking.pickupLng,
          dropLat: booking.dropLat,
          dropLng: booking.dropLng,
          deliverySpeed: booking.deliverySpeed,
          packageType: booking.packageType,
          packageWeightKg: booking.packageWeightKg,
        });

        setQuote(res);
        updateBooking({ quote: res });
      } catch (err) {
        console.error("Failed to fetch quote", err);
        setError("Could not calculate dynamic quote. Using standard rates.");
        // Fallback default
        const fallback = {
          baseFarePaise: booking.deliverySpeed === "EXPRESS" ? 8000 : 5000,
          distanceChargePaise: 5000,
          speedChargePaise: booking.deliverySpeed === "EXPRESS" ? 3000 : 0,
          totalFarePaise: 16000,
          totalFareRupees: 160,
          distanceKm: 3.5,
          estimatedDurationMins: 18,
        };
        setQuote(fallback);
        updateBooking({ quote: fallback });
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [booking.deliverySpeed, booking.packageWeightKg, booking.pickupAddress, booking.dropAddress]);

  const baseFare = quote ? quote.baseFarePaise / 100 : 80;
  const distanceCharge = quote ? quote.distanceChargePaise / 100 : 50;
  const speedCharge = quote ? quote.speedChargePaise / 100 : 30;
  const totalFare = quote ? quote.totalFareRupees : 160;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer/package")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Fare Estimate</h1>
          <p>Review your delivery cost</p>
        </div>
      </header>

      <main className="form-page">
        {/* PROGRESS */}
        <div className="booking-progress">
          <div className="progress-step completed">
            <span>✓</span>
            <p>Route</p>
          </div>

          <div className="progress-line active"></div>

          <div className="progress-step completed">
            <span>✓</span>
            <p>Package</p>
          </div>

          <div className="progress-line active"></div>

          <div className="progress-step active">
            <span>3</span>
            <p>Payment</p>
          </div>
        </div>

        {/* ROUTE SUMMARY */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <MapPin size={21} />
            </div>

            <div>
              <h2>Delivery Route</h2>
              <p>Your selected pickup and destination</p>
            </div>
          </div>

          <div className="summary-route">
            <div className="summary-point">
              <span className="location-dot pickup-dot"></span>
              <div>
                <small>Pickup</small>
                <strong>{booking.pickupAddress.split(",")[0] || "Parvathipuram"}</strong>
              </div>
            </div>

            <div className="summary-line"></div>

            <div className="summary-point">
              <span className="location-dot destination-dot"></span>
              <div>
                <small>Destination</small>
                <strong>{booking.dropAddress.split(",")[0] || "Nagercoil"}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* PACKAGE SUMMARY */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Package size={21} />
            </div>

            <div>
              <h2>Package</h2>
              <p>Delivery package information</p>
            </div>
          </div>

          <div className="fare-info-row">
            <span>Package Type</span>
            <strong>
              {booking.packageType.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </strong>
          </div>

          <div className="fare-info-row">
            <span>Weight</span>
            <strong>{booking.packageWeightKg} KG</strong>
          </div>

          <div className="fare-info-row">
            <span>Delivery Type</span>
            <strong>{booking.deliverySpeed === "EXPRESS" ? "Express" : "Standard"}</strong>
          </div>

          {quote?.distanceKm && (
            <div className="fare-info-row">
              <span>Estimated Distance</span>
              <strong>{quote.distanceKm} KM</strong>
            </div>
          )}
        </section>

        {/* FARE BREAKDOWN */}
        <section className="fare-card">
          <div className="fare-title">
            <Truck size={22} />
            <h2>Fare Breakdown</h2>
          </div>

          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
              <Loader2 className="animate-spin" size={24} style={{ display: "inline-block", marginBottom: "8px" }} />
              <p>Calculating live quote...</p>
            </div>
          ) : (
            <>
              <div className="fare-row">
                <span>Base Fare</span>
                <strong>₹{baseFare}</strong>
              </div>

              <div className="fare-row">
                <span>Distance Charge</span>
                <strong>₹{distanceCharge}</strong>
              </div>

              {speedCharge > 0 && (
                <div className="fare-row">
                  <span>Express Charge</span>
                  <strong>₹{speedCharge}</strong>
                </div>
              )}

              <div className="fare-divider"></div>

              <div className="fare-total">
                <span>Total Fare</span>
                <strong>₹{totalFare}</strong>
              </div>
            </>
          )}
        </section>

        {/* PAYMENT */}
        <section
          className="payment-method-card"
          onClick={() => navigate("/customer/payment")}
          style={{ cursor: "pointer" }}
        >
          <div className="payment-icon">
            <CreditCard size={22} />
          </div>

          <div>
            <strong>Payment</strong>
            <span>Choose payment method on next step</span>
          </div>

          <ChevronRight size={20} />
        </section>

        {/* CONTINUE */}
        <button
          className="continue-btn"
          disabled={loading}
          onClick={() => navigate("/customer/payment")}
        >
          Proceed to Payment
          <ChevronRight size={20} />
        </button>
      </main>
    </div>
  );
}

export default FareEstimate;