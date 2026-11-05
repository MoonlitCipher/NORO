import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Clock3,
  Headphones,
  Loader2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ordersApi } from "../../api/client";
import "./OrderDetails.css";

function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError("");
      try {
        let res;
        if (id && id.startsWith("PDMS-")) {
          res = await ordersApi.track(id);
        } else if (id) {
          res = await ordersApi.getById(id);
        } else {
          res = await ordersApi.track("PDMS-10246");
        }
        setOrder(res);
      } catch (err) {
        console.error("Failed to load order details", err);
        setError("Could not find order. Showing demo details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    setCancelling(true);
    try {
      await ordersApi.cancel(order.id, reason);
      alert("Order cancelled successfully.");
      // Refresh order
      const updated = await ordersApi.getById(order.id);
      setOrder(updated);
    } catch (err) {
      alert(err.message || "Could not cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="app" style={{ textAlign: "center", padding: "60px 20px" }}>
        <Loader2 className="animate-spin" size={36} color="#D4030B" style={{ margin: "0 auto 12px" }} />
        <p>Loading order details...</p>
      </div>
    );
  }

  const orderData = order || {
    trackingNumber: "PDMS-10246",
    status: "IN_TRANSIT",
    pickupAddress: "Parvathipuram, Nagercoil",
    dropAddress: "Tower Junction, Court Road, Nagercoil",
    packageType: "SMALL_PARCEL",
    packageWeightKg: 1,
    fareBasePaise: 8000,
    fareDistancePaise: 5000,
    fareSpeedPaise: 3000,
    fareTotalPaise: 16000,
  };

  const isCancellable = ["PLACED", "ASSIGNED"].includes(orderData.status);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer/orders")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Order Details</h1>
          <p>{orderData.trackingNumber}</p>
        </div>
      </header>

      <main className="order-details-page">
        {/* STATUS */}
        <div className="details-status-card">
          <div className="details-status-icon">
            <Truck size={26} />
          </div>

          <div className="details-status-content">
            <strong>{orderData.status.replace("_", " ")}</strong>
            <span>
              {orderData.status === "DELIVERED"
                ? "Delivered successfully"
                : orderData.status === "CANCELLED"
                ? "This order was cancelled"
                : "Your parcel is on the way"}
            </span>
          </div>

          {["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKUP_IN_PROGRESS"].includes(orderData.status) && (
            <span className="details-live-badge">LIVE</span>
          )}
        </div>

        {/* DELIVERY ROUTE */}
        <section className="details-card">
          <div className="details-card-heading">
            <div className="details-heading-icon">
              <MapPin size={18} />
            </div>
            <h2>Delivery Route</h2>
          </div>

          <div className="order-route">
            <div className="order-route-item">
              <div className="order-route-marker pickup-marker">
                <MapPin size={17} />
              </div>
              <div className="order-route-content">
                <small>Pickup Location</small>
                <strong>{orderData.pickupAddress}</strong>
              </div>
            </div>

            <div className="order-route-line"></div>

            <div className="order-route-item">
              <div className="order-route-marker destination-marker">
                <MapPin size={17} />
              </div>
              <div className="order-route-content">
                <small>Delivery Location</small>
                <strong>{orderData.dropAddress}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* PACKAGE DETAILS */}
        <section className="details-card">
          <div className="details-card-heading">
            <div className="details-heading-icon">
              <Package size={18} />
            </div>
            <h2>Package Details</h2>
          </div>

          <div className="details-grid">
            <div>
              <span>Package Type</span>
              <strong>{orderData.packageType}</strong>
            </div>

            <div>
              <span>Weight</span>
              <strong>{orderData.packageWeightKg} KG</strong>
            </div>

            <div>
              <span>Delivery Speed</span>
              <strong>{orderData.deliverySpeed || "EXPRESS"}</strong>
            </div>

            <div>
              <span>Estimated Duration</span>
              <strong>{orderData.estimatedDurationMins || 20} mins</strong>
            </div>
          </div>
        </section>

        {/* PAYMENT BREAKDOWN */}
        <section className="details-card">
          <div className="details-card-heading">
            <div className="details-heading-icon">
              <CreditCard size={18} />
            </div>
            <h2>Payment Breakdown</h2>
          </div>

          <div className="fare-row">
            <span>Base Fare</span>
            <strong>₹{(orderData.fareBasePaise || 8000) / 100}</strong>
          </div>

          <div className="fare-row">
            <span>Distance Charge</span>
            <strong>₹{(orderData.fareDistancePaise || 5000) / 100}</strong>
          </div>

          {(orderData.fareSpeedPaise || 0) > 0 && (
            <div className="fare-row">
              <span>Express Surcharge</span>
              <strong>₹{orderData.fareSpeedPaise / 100}</strong>
            </div>
          )}

          <div className="fare-divider"></div>

          <div className="fare-total">
            <span>Total Paid</span>
            <strong>₹{(orderData.fareTotalPaise || 16000) / 100}</strong>
          </div>
        </section>

        {/* CANCEL ORDER ACTION IF ELIGIBLE */}
        {isCancellable && (
          <button
            type="button"
            style={{
              width: "100%",
              padding: "12px",
              background: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #f87171",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "16px",
            }}
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? "Processing..." : "Cancel Booking"}
          </button>
        )}

        {/* SUPPORT */}
        <button
          className="help-btn"
          onClick={() => alert("Support ticket opened. Our operations team will reach out.")}
        >
          <Headphones size={18} />
          Need Help with this Order?
        </button>
      </main>
    </div>
  );
}

export default OrderDetails;