import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partnerApi } from "../../api/client";

function DeliveryHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const list = await partnerApi.getHistory();
        setHistory(list || []);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/partner")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Delivery History</h1>
          <p>Completed jobs archive</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : history.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((order) => (
              <div key={order.id} className="form-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong>{order.trackingNumber}</strong>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: order.status === "DELIVERED" ? "#dcfce7" : "#fee2e2",
                      color: order.status === "DELIVERED" ? "#166534" : "#991b1b",
                      fontWeight: "bold",
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                <p style={{ fontSize: "14px", margin: "4px 0", color: "#444" }}>
                  {order.pickupAddress.split(",")[0]} → {order.dropAddress.split(",")[0]}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "13px", color: "#666" }}>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <strong style={{ color: "#16a34a" }}>
                    +₹{(order.earnings?.[0]?.netAmountPaise || order.fareTotalPaise * 0.8) / 100}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "16px" }}>
            <Package size={40} color="#888" style={{ margin: "0 auto 12px" }} />
            <h3>No Past Deliveries</h3>
            <p style={{ color: "#666" }}>Completed delivery jobs will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DeliveryHistory;
