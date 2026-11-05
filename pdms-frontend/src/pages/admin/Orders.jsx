import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  Search,
  Truck,
  User,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ordersApi, adminApi, dispatchApi } from "../../api/client";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, partList] = await Promise.all([
        ordersApi.list({ search: search || undefined }),
        adminApi.getPartners(),
      ]);
      setOrders(ordRes?.orders || []);
      setPartners(partList || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleManualAssign = async (orderId) => {
    if (!selectedPartnerId) {
      alert("Please select a partner first.");
      return;
    }

    try {
      await dispatchApi.assignPartner(orderId, selectedPartnerId);
      alert("Partner assigned successfully!");
      setAssigningOrderId(null);
      await loadData();
    } catch (e) {
      alert(e.message || "Failed to assign partner");
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Order Management</h1>
          <p>System-wide parcel orders & dispatch</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {/* SEARCH */}
        <div className="auth-input" style={{ marginBottom: "16px", background: "#fff", padding: "8px 12px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={18} color="#888" />
          <input
            type="text"
            placeholder="Search tracking number or address..."
            style={{ border: "none", outline: "none", width: "100%" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : orders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {orders.map((ord) => (
              <div key={ord.id} className="form-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "16px" }}>{ord.trackingNumber}</strong>
                  <span className="status-badge">{ord.status}</span>
                </div>

                <p style={{ margin: "4px 0", fontSize: "14px", color: "#444" }}>
                  <b>Route:</b> {ord.pickupAddress.split(",")[0]} → {ord.dropAddress.split(",")[0]}
                </p>

                <div style={{ fontSize: "13px", color: "#666", margin: "6px 0" }}>
                  Customer: <b>{ord.customer?.name}</b> ({ord.customer?.phone}) <br />
                  Assigned Partner:{" "}
                  {ord.partner ? (
                    <b style={{ color: "#16a34a" }}>{ord.partner.user?.name}</b>
                  ) : (
                    <b style={{ color: "#ef4444" }}>Unassigned</b>
                  )}
                </div>

                {/* MANUAL ASSIGNMENT ROW */}
                {!ord.partner && ord.status === "PLACED" && (
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #eee" }}>
                    {assigningOrderId === ord.id ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <select
                          style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}
                          value={selectedPartnerId}
                          onChange={(e) => setSelectedPartnerId(e.target.value)}
                        >
                          <option value="">Select Partner...</option>
                          {partners
                            .filter((p) => p.kycStatus === "APPROVED")
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.user?.name} ({p.isAvailable ? "Online" : "Offline"})
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleManualAssign(ord.id)}
                          style={{ background: "#22c55e", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", fontWeight: "bold" }}
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => setAssigningOrderId(null)}
                          style={{ background: "#eee", border: "none", padding: "8px", borderRadius: "8px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningOrderId(ord.id)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          background: "#FDE10F",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        Manually Assign Partner
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#777" }}>No orders found matching search.</p>
        )}
      </main>
    </div>
  );
}

export default Orders;
