import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Package,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Clock,
  Loader2,
  Sliders,
  CreditCard,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const res = await adminApi.getDashboard();
        setData(res);
      } catch (err) {
        console.warn("Failed to load admin metrics", err);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  const metrics = data?.metrics || {
    totalOrders: 2,
    activeOrders: 1,
    deliveredOrders: 1,
    grossRevenueRupees: 320,
    platformCommissionRupees: 64,
    totalPartners: 2,
    onlinePartners: 1,
    pendingKycPartners: 1,
  };

  return (
    <div className="app">
      <header className="page-header" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Admin Console</h1>
          <p>Operations & PDMS Overview</p>
        </div>
        <div style={{ background: "#171717", color: "#ffd21f", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}>
          {user?.role || "ADMIN"}
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {/* KPI CARDS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div className="form-card" style={{ padding: "14px" }}>
            <span style={{ color: "#777", fontSize: "12px" }}>TOTAL ORDERS</span>
            <h2 style={{ fontSize: "22px", margin: "4px 0" }}>{metrics.totalOrders}</h2>
            <small style={{ color: "#22c55e", fontWeight: "bold" }}>{metrics.activeOrders} in progress</small>
          </div>

          <div className="form-card" style={{ padding: "14px" }}>
            <span style={{ color: "#777", fontSize: "12px" }}>PLATFORM REVENUE</span>
            <h2 style={{ fontSize: "22px", margin: "4px 0", color: "#16a34a" }}>₹{metrics.grossRevenueRupees}</h2>
            <small style={{ color: "#555" }}>Comm: ₹{metrics.platformCommissionRupees}</small>
          </div>

          <div
            className="form-card"
            style={{ padding: "14px", cursor: "pointer", borderLeft: metrics.pendingKycPartners > 0 ? "4px solid #f59e0b" : undefined }}
            onClick={() => navigate("/admin/partners")}
          >
            <span style={{ color: "#777", fontSize: "12px" }}>PARTNERS</span>
            <h2 style={{ fontSize: "22px", margin: "4px 0" }}>{metrics.totalPartners}</h2>
            <small style={{ color: metrics.pendingKycPartners > 0 ? "#d97706" : "#22c55e", fontWeight: "bold" }}>
              {metrics.pendingKycPartners} pending KYC
            </small>
          </div>

          <div
            className="form-card"
            style={{ padding: "14px", cursor: "pointer" }}
            onClick={() => navigate("/admin/tracking")}
          >
            <span style={{ color: "#777", fontSize: "12px" }}>LIVE ON ROAD</span>
            <h2 style={{ fontSize: "22px", margin: "4px 0", color: "#ed1c24" }}>{metrics.activeOrders}</h2>
            <small style={{ color: "#666" }}>Live GPS Tracking</small>
          </div>
        </div>

        {/* OPERATIONS NAVIGATION MODULES */}
        <section className="form-card" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Management Modules</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              className="profile-menu-item"
              onClick={() => navigate("/admin/partners")}
              style={{ cursor: "pointer", padding: "10px 0" }}
            >
              <div className="profile-menu-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                <Users size={20} />
              </div>
              <div className="profile-menu-text">
                <strong>Partner KYC Approvals</strong>
                <span>Verify driving licenses & vehicles</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="profile-menu-item"
              onClick={() => navigate("/admin/orders")}
              style={{ cursor: "pointer", padding: "10px 0" }}
            >
              <div className="profile-menu-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                <Package size={20} />
              </div>
              <div className="profile-menu-text">
                <strong>Order Management & Dispatch</strong>
                <span>All orders and manual dispatch</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="profile-menu-item"
              onClick={() => navigate("/admin/tracking")}
              style={{ cursor: "pointer", padding: "10px 0" }}
            >
              <div className="profile-menu-icon" style={{ background: "#fee2e2", color: "#ed1c24" }}>
                <MapPin size={20} />
              </div>
              <div className="profile-menu-text">
                <strong>Live Fleet Tracking</strong>
                <span>Real-time delivery map and milestones</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="profile-menu-item"
              onClick={() => navigate("/admin/pricing")}
              style={{ cursor: "pointer", padding: "10px 0" }}
            >
              <div className="profile-menu-icon" style={{ background: "#f3e8ff", color: "#9333ea" }}>
                <Sliders size={20} />
              </div>
              <div className="profile-menu-text">
                <strong>Pricing Engine Rules</strong>
                <span>Configurable base fare & distance rates</span>
              </div>
              <ChevronRight size={18} />
            </div>

            <div
              className="profile-menu-item"
              onClick={() => navigate("/admin/settlements")}
              style={{ cursor: "pointer", padding: "10px 0" }}
            >
              <div className="profile-menu-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                <CreditCard size={20} />
              </div>
              <div className="profile-menu-text">
                <strong>Partner Settlements</strong>
                <span>Review and process bank payouts</span>
              </div>
              <ChevronRight size={18} />
            </div>
          </div>
        </section>

        {/* RECENT ORDERS FEED */}
        <section className="form-card">
          <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Recent Activity</h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (data?.recentOrders || []).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <strong>{ord.trackingNumber}</strong>
                    <br />
                    <small style={{ color: "#666" }}>
                      Customer: {ord.customer?.name} • ₹{ord.fareTotalPaise / 100}
                    </small>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: ord.status === "DELIVERED" ? "#dcfce7" : "#fef3c7",
                      color: ord.status === "DELIVERED" ? "#166534" : "#92400e",
                      fontWeight: "bold",
                    }}
                  >
                    {ord.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#777", fontSize: "14px" }}>No recent orders.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
