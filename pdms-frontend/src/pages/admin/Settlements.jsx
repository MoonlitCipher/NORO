import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Loader2,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { earningsApi } from "../../api/client";

function Settlements() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const list = await earningsApi.getAllSettlements();
      setSettlements(list || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleProcess = async (id) => {
    setProcessingId(id);
    try {
      await earningsApi.processSettlement(id);
      alert("Payout processed successfully!");
      await fetchSettlements();
    } catch (e) {
      alert(e.message || "Failed to process settlement");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Partner Settlements</h1>
          <p>Bank payouts & commission disbursement</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : settlements.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {settlements.map((s) => (
              <div key={s.id} className="form-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <strong>{s.partner?.user?.name || "Partner"}</strong>
                    <br />
                    <small style={{ color: "#666" }}>Ref: {s.referenceNumber || s.id.slice(0, 8)}</small>
                  </div>
                  <strong style={{ fontSize: "18px", color: "#16a34a" }}>
                    ₹{s.amountPaise / 100}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: s.status === "COMPLETED" ? "#dcfce7" : "#fef3c7",
                      color: s.status === "COMPLETED" ? "#166534" : "#92400e",
                      fontWeight: "bold",
                    }}
                  >
                    {s.status}
                  </span>

                  {s.status === "PENDING" && (
                    <button
                      onClick={() => handleProcess(s.id)}
                      disabled={processingId === s.id}
                      style={{
                        padding: "6px 14px",
                        background: "#22c55e",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {processingId === s.id ? "Processing..." : "Approve & Pay"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "16px" }}>
            <CreditCard size={40} color="#888" style={{ margin: "0 auto 12px" }} />
            <h3>No Settlements Pending</h3>
            <p style={{ color: "#666" }}>Payout requests will show up here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Settlements;
