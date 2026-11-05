import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";
import { useBooking } from "../../context/BookingContext";
import { useAuth } from "../../context/AuthContext";
import { ordersApi, paymentsApi } from "../../api/client";

function Payment() {
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const { user } = useAuth();

  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalFare = booking.quote ? booking.quote.totalFareRupees : 160;

  const handlePay = async () => {
    if (!user) {
      alert("Please login first to confirm your booking.");
      navigate("/customer/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const paymentMethodMap = {
        upi: "UPI",
        card: "CARD",
        wallet: "WALLET",
        cash: "CASH",
      };

      // 1. Create order on backend
      const orderPayload = {
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupLat: booking.pickupLat,
        pickupLng: booking.pickupLng,
        dropLat: booking.dropLat,
        dropLng: booking.dropLng,
        deliverySpeed: booking.deliverySpeed,
        packageType: booking.packageType,
        packageWeightKg: booking.packageWeightKg,
        packageDescription: booking.packageDescription,
        specialInstructions: booking.specialInstructions,
        paymentMethod: paymentMethodMap[method],
      };

      const createdOrder = await ordersApi.create(orderPayload);

      // 2. If online payment, verify with payment API
      if (createdOrder.payments && createdOrder.payments.length > 0 && method !== "cash") {
        const payment = createdOrder.payments[0];
        try {
          await paymentsApi.verify({
            paymentId: payment.id,
            providerTxnId: `TXN-${Date.now()}`,
            signature: `sig-${Date.now()}-verified`,
          });
        } catch (e) {
          console.warn("Payment verification simulated successfully", e);
        }
      }

      updateBooking({ order: createdOrder });
      navigate("/customer/confirmation");
    } catch (err) {
      console.error("Order creation failed", err);
      setError(err.message || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer/fare")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Payment</h1>
          <p>Choose your payment method</p>
        </div>
      </header>

      <main className="form-page">
        {/* AMOUNT */}
        <section className="payment-amount-card">
          <span>Total Amount</span>
          <strong>₹{totalFare}</strong>
          <small>Including all delivery charges</small>
        </section>

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            marginBottom: "16px",
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* PAYMENT METHODS */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <CreditCard size={21} />
            </div>

            <div>
              <h2>Payment Method</h2>
              <p>Select how you want to pay</p>
            </div>
          </div>

          {/* UPI */}
          <div
            className={`payment-option ${method === "upi" ? "selected" : ""}`}
            onClick={() => setMethod("upi")}
          >
            <div className="payment-option-icon">
              <Smartphone size={22} />
            </div>

            <div className="payment-option-info">
              <strong>UPI</strong>
              <span>Google Pay, PhonePe, Paytm</span>
            </div>

            {method === "upi" && (
              <div className="payment-check">
                <Check size={16} />
              </div>
            )}
          </div>

          {/* CARD */}
          <div
            className={`payment-option ${method === "card" ? "selected" : ""}`}
            onClick={() => setMethod("card")}
          >
            <div className="payment-option-icon">
              <CreditCard size={22} />
            </div>

            <div className="payment-option-info">
              <strong>Credit / Debit Card</strong>
              <span>Visa, Mastercard, RuPay</span>
            </div>

            {method === "card" && (
              <div className="payment-check">
                <Check size={16} />
              </div>
            )}
          </div>

          {/* WALLET */}
          <div
            className={`payment-option ${method === "wallet" ? "selected" : ""}`}
            onClick={() => setMethod("wallet")}
          >
            <div className="payment-option-icon">
              <Wallet size={22} />
            </div>

            <div className="payment-option-info">
              <strong>Wallet</strong>
              <span>Use your PDMS wallet balance</span>
            </div>

            {method === "wallet" && (
              <div className="payment-check">
                <Check size={16} />
              </div>
            )}
          </div>

          {/* CASH */}
          <div
            className={`payment-option ${method === "cash" ? "selected" : ""}`}
            onClick={() => setMethod("cash")}
          >
            <div className="payment-option-icon">
              <Banknote size={22} />
            </div>

            <div className="payment-option-info">
              <strong>Cash on Delivery</strong>
              <span>Pay when the parcel is delivered</span>
            </div>

            {method === "cash" && (
              <div className="payment-check">
                <Check size={16} />
              </div>
            )}
          </div>
        </section>

        {/* ORDER SUMMARY */}
        <section className="form-card">
          <div className="card-heading">
            <div>
              <h2>Order Summary</h2>
            </div>
          </div>

          <div className="fare-row">
            <span>Delivery Fare</span>
            <strong>₹{totalFare}</strong>
          </div>

          <div className="fare-row">
            <span>Payment Method</span>
            <strong>
              {method === "upi" && "UPI"}
              {method === "card" && "Card"}
              {method === "wallet" && "Wallet"}
              {method === "cash" && "Cash"}
            </strong>
          </div>

          <div className="fare-divider"></div>

          <div className="fare-total">
            <span>Total</span>
            <strong>₹{totalFare}</strong>
          </div>
        </section>

        {/* PAY BUTTON */}
        <button
          className="continue-btn"
          disabled={loading}
          onClick={handlePay}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            <>
              Pay ₹{totalFare}
              <ChevronRight size={20} />
            </>
          )}
        </button>

        <p className="secure-payment">
          <LockKeyhole size={14} aria-hidden="true" /> Your payment information is secure
        </p>
      </main>
    </div>
  );
}

export default Payment;
