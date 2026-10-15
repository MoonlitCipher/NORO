import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  Truck,
  CreditCard,
  ChevronRight,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/client";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifs() {
      setLoading(true);
      try {
        const list = await notificationsApi.getAll();
        setNotifications(list || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifs();
  }, []);

  const handleClear = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationsApi.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
      } catch (e) {
        console.warn(e);
      }
    }

    if (notif.metadata?.trackingNumber) {
      navigate(`/customer/track?id=${notif.metadata.trackingNumber}`);
    } else {
      navigate("/customer/orders");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="app">
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Notifications</h1>
          <p>Your latest delivery updates</p>
        </div>
      </header>

      <main className="notifications-page">
        {/* TOP SUMMARY */}
        <div className="notification-summary">
          <div className="notification-summary-icon">
            <Bell size={24} />
          </div>

          <div>
            <strong>Notifications</strong>
            <span>
              {unreadCount > 0 ? `You have ${unreadCount} new update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
            </span>
          </div>

          {notifications.length > 0 && (
            <button className="clear-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <Loader2 className="animate-spin" size={32} style={{ display: "inline-block", marginBottom: "12px" }} />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <section className="notification-group">
            <h2>Recent Updates</h2>

            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification-item ${!notif.isRead ? "unread" : ""}`}
                onClick={() => handleItemClick(notif)}
                style={{ cursor: "pointer" }}
              >
                <div
                  className={`notification-item-icon ${
                    notif.type === "PAYMENT" ? "payment" : "delivery"
                  }`}
                >
                  {notif.type === "PAYMENT" ? (
                    <CreditCard size={21} />
                  ) : (
                    <Truck size={21} />
                  )}
                </div>

                <div className="notification-item-content">
                  <div className="notification-item-title">
                    <strong>{notif.title}</strong>
                    {!notif.isRead && <span className="new-dot"></span>}
                  </div>

                  <p>{notif.message}</p>

                  <small>
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </small>
                </div>

                <ChevronRight size={18} />
              </div>
            ))}
          </section>
        ) : (
          <div style={{
            background: "#ffffff",
            padding: "36px 20px",
            borderRadius: "16px",
            textAlign: "center",
            marginTop: "20px",
          }}>
            <CheckCheck size={40} color="#10b981" style={{ margin: "0 auto 12px" }} />
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "6px" }}>No notifications</strong>
            <p style={{ color: "#777", fontSize: "14px" }}>
              You don't have any new alerts right now.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;
