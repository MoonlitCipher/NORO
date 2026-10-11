import { useState, useEffect } from "react";
import {
  Bell,
  ChevronRight,
  MapPin,
  Package,
  Search,
  ClipboardList,
  Truck,
  Navigation,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ordersApi, notificationsApi } from "../../api/client";

function CustomerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeOrder, setActiveOrder] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch active orders
        const ordersRes = await ordersApi.list({ limit: 5 });
        const list = ordersRes?.orders || [];
        const active = list.find((o) =>
          ["PLACED", "ASSIGNED", "PICKUP_IN_PROGRESS", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status),
        );
        setActiveOrder(active || null);

        // Fetch notifications count
        const notifs = await notificationsApi.getAll();
        const unread = (notifs || []).filter((n) => !n.isRead).length;
        setUnreadNotifications(unread);
      } catch (err) {
        console.warn("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatStatus = (status) => {
    switch (status) {
      case "PLACED":
        return "Booking Placed";
      case "ASSIGNED":
        return "Partner Assigned";
      case "PICKUP_IN_PROGRESS":
        return "Pickup in Progress";
      case "PICKED_UP":
        return "Picked Up";
      case "IN_TRANSIT":
        return "In Transit";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      default:
        return status;
    }
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="top-header">
        <div className="brand-row">
          <div className="brand-logo">
            <Truck size={30} />
          </div>

          <div>
            <h1>PDMS</h1>
            <p>Parcel • Delivery • Management</p>
          </div>
        </div>

        <div className="location">
          <MapPin size={20} />
          <span>Nagercoil</span>
          <ChevronRight size={18} />
        </div>

        <button
          className="notification-btn"
          onClick={() => navigate("/customer/notifications")}
        >
          <Bell size={23} />
          {unreadNotifications > 0 && <span></span>}
        </button>
      </header>

      {/* SEARCH */}
      <div className="search-box">
        <Search size={23} />
        <input
          type="text"
          placeholder="Where are you sending today?"
          onClick={() => navigate("/customer/book")}
          readOnly
        />
      </div>

      <main>
        {/* HERO BANNER */}
        <section className="hero-banner">
          <div className="hero-content">
            <p className="hero-small">FAST & SAFE</p>

            <h2>
              Parcel Delivery
              <br />
              <span>At Your Door</span>
            </h2>

            <p className="hero-description">
              Quick pickup • Safe delivery • Live tracking
            </p>

            <button
              className="primary-btn"
              onClick={() => navigate("/customer/book")}
            >
              Book Delivery
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="hero-graphic">
            <div className="parcel-box">
              <Package size={78} />
            </div>

            <div className="route-line"></div>

            <div className="delivery-pin">
              <Navigation size={28} />
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="section">
          <div className="section-title">
            <h3>Quick Actions</h3>
          </div>

          <div className="quick-actions">
            {/* BOOK PARCEL */}
            <div
              className="quick-item"
              onClick={() => navigate("/customer/book")}
            >
              <div className="quick-icon">
                <Package />
              </div>
              <span>Book Parcel</span>
            </div>

            {/* TRACK PARCEL */}
            <div
              className="quick-item"
              onClick={() =>
                navigate(
                  activeOrder
                    ? `/customer/track?id=${activeOrder.trackingNumber}`
                    : "/customer/track",
                )
              }
            >
              <div className="quick-icon">
                <Navigation />
              </div>
              <span>Track Parcel</span>
            </div>

            {/* MY ORDERS */}
            <div
              className="quick-item"
              onClick={() => navigate("/customer/orders")}
            >
              <div className="quick-icon">
                <ClipboardList />
              </div>
              <span>My Orders</span>
            </div>

            {/* ADDRESSES */}
            <div
              className="quick-item"
              onClick={() => navigate("/customer/addresses")}
            >
              <div className="quick-icon">
                <MapPin />
              </div>
              <span>Addresses</span>
            </div>
          </div>
        </section>

        {/* ACTIVE DELIVERY */}
        <section className="section">
          <div className="section-heading">
            <h3>Active Delivery</h3>
            {activeOrder && <span className="live-status">● LIVE</span>}
          </div>

          {activeOrder ? (
            <div
              className="active-card"
              onClick={() => navigate(`/customer/order/${activeOrder.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="active-top">
                <div className="delivery-id">
                  <div className="small-icon">
                    <Truck size={20} />
                  </div>

                  <div>
                    <strong>{activeOrder.trackingNumber}</strong>
                    <span>
                      {activeOrder.deliverySpeed === "EXPRESS"
                        ? "Express Delivery"
                        : "Standard Delivery"}
                    </span>
                  </div>
                </div>

                <span className="status-badge">
                  {formatStatus(activeOrder.status)}
                </span>
              </div>

              <div className="delivery-route">
                <div className="route-point">
                  <span className="route-dot pickup"></span>
                  <div>
                    <small>Pickup</small>
                    <strong>
                      {activeOrder.pickupAddress.split(",")[0] || "Parvathipuram"}
                    </strong>
                  </div>
                </div>

                <div className="route-connector"></div>

                <div className="route-point">
                  <span className="route-dot destination"></span>
                  <div>
                    <small>Destination</small>
                    <strong>
                      {activeOrder.dropAddress.split(",")[0] || "Nagercoil"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="active-footer">
                <div className="arrival">
                  <Clock3 size={18} />
                  <span>
                    Est. {activeOrder.estimatedDurationMins || 20} mins
                  </span>
                </div>

                <button
                  className="track-link-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/customer/track?id=${activeOrder.trackingNumber}`);
                  }}
                >
                  Track Live
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Package size={40} color="#ffd21f" style={{ margin: "0 auto 12px" }} />
              <strong style={{ display: "block", marginBottom: "6px" }}>No Active Delivery</strong>
              <p style={{ color: "#777", fontSize: "14px", marginBottom: "16px" }}>
                Ready to send a parcel across town? Book in 3 simple steps.
              </p>
              <button
                className="primary-btn"
                style={{ width: "auto", display: "inline-flex", padding: "10px 24px" }}
                onClick={() => navigate("/customer/book")}
              >
                Send a Parcel
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CustomerHome;