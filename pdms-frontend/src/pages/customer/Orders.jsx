import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Truck,
  CheckCircle,
  Clock3,
  XCircle,
  Loader2,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "../../api/client";

function Orders() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await ordersApi.list();
        setOrders(res?.orders || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "active") {
      return ["PLACED", "ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
        order.status,
      );
    }
    if (filter === "delivered") return order.status === "DELIVERED";
    if (filter === "cancelled") return order.status === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "DELIVERED":
        return <span className="order-status delivered">Delivered</span>;
      case "CANCELLED":
        return <span className="order-status cancelled">Cancelled</span>;
      default:
        return <span className="order-status transit">In Transit</span>;
    }
  };

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
          <h1>My Orders</h1>
          <p>View and manage your deliveries</p>
        </div>
      </header>

      <main className="orders-page">
        {/* FILTERS */}
        <div className="order-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`filter-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>

          <button
            className={`filter-btn ${filter === "delivered" ? "active" : ""}`}
            onClick={() => setFilter("delivered")}
          >
            Delivered
          </button>

          <button
            className={`filter-btn ${filter === "cancelled" ? "active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            Cancelled
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <Loader2 className="animate-spin" size={32} style={{ display: "inline-block", marginBottom: "12px" }} />
            <p>Loading your orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <section className="order-section">
            <h2>{filter.toUpperCase()} Orders ({filteredOrders.length})</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="order-card active-order"
                  onClick={() => navigate(`/customer/order/${order.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="order-card-top">
                    <div className="order-icon">
                      <Truck size={22} />
                    </div>

                    <div className="order-main-info">
                      <strong>{order.trackingNumber}</strong>
                      <span>
                        {order.pickupAddress.split(",")[0]} → {order.dropAddress.split(",")[0]}
                      </span>
                    </div>

                    <ChevronRight size={20} />
                  </div>

                  <div className="order-status-row">
                    {getStatusBadge(order.status)}
                    <strong>₹{order.fareTotalPaise / 100}</strong>
                  </div>

                  <div className="order-timeline-info">
                    <small>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </small>
                    <span>
                      {order.deliverySpeed === "EXPRESS" ? "Express Delivery" : "Standard Delivery"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div style={{
            background: "#ffffff",
            padding: "36px 20px",
            borderRadius: "16px",
            textAlign: "center",
            marginTop: "20px",
          }}>
            <Package size={44} color="#999" style={{ margin: "0 auto 12px" }} />
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>No orders found</strong>
            <p style={{ color: "#777", fontSize: "14px", marginBottom: "16px" }}>
              You don't have any orders under "{filter}".
            </p>
            <button
              className="primary-btn"
              style={{ width: "auto", display: "inline-flex", padding: "10px 24px" }}
              onClick={() => navigate("/customer/book")}
            >
              Book Delivery
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;