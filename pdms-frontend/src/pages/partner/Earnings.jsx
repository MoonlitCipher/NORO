import { useState, useEffect } from "react";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { earningsApi } from "../../api/client";

function Earnings() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await earningsApi.getMyEarnings();
      setData(res);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleRequestPayout = async () => {
    if (!data?.pendingSettlementPaise || data.pendingSettlementPaise <= 0) {
      alert("No pending credited earnings available for payout.");
      return;
    }

    setRequesting(true);
    try {
      await earningsApi.requestSettlement();
      alert("Payout request submitted successfully! Funds will be transferred to your registered bank account.");
      await fetchEarnings();
    } catch (e) {
      alert(e.message || "Failed to submit payout request");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/partner")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Earnings & Wallet</h1>
          <p>Nextus Partner Commission</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {/* TOTAL EARNINGS CARD */}
        <section
          style={{
            background: "linear-gradient(135deg, #171717 0%, #2a2a2a 100%)",
            color: "#fff",
            borderRadius: "16px",
            padding: "24px 20px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#FDE10F", textTransform: "uppercase", letterSpacing: "1px" }}>
            Total Lifetime Earnings
          </span>
          <h2 style={{ fontSize: "32px", margin: "8px 0" }}>
            ₹{data?.totalEarnedRupees || 0}
          </h2>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #444" }}>
            <div>
              <small style={{ color: "#aaa" }}>Available for Payout</small>
              <p style={{ margin: "2px 0", fontSize: "18px", fontWeight: "bold", color: "#22c55e" }}>
                ₹{data?.pendingSettlementRupees || 0}
              </p>
            </div>

            <button
              onClick={handleRequestPayout}
              disabled={requesting || (data?.pendingSettlementPaise || 0) <= 0}
              style={{
                background: "#FDE10F",
                color: "#171717",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: "bold",
                fontSize: "13px",
                cursor: "pointer",
                alignSelf: "center",
              }}
            >
              {requesting ? "Requesting..." : "Request Payout"}
            </button>
          </div>
        </section>

        {/* BANK ACCOUNT */}
        <section className="form-card" style={{ marginBottom: "16px" }}>
          <div className="card-heading">
            <div className="card-heading-icon">
              <CreditCard size={21} />
            </div>
            <div>
              <h2>Registered Payout Account</h2>
              <p>Direct bank deposit</p>
            </div>
          </div>

          <p style={{ margin: "4px 0", fontSize: "14px" }}>
            <b>Account:</b> {data?.bankAccount || "•••• •••• 5012"}
          </p>
          <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
            <b>IFSC:</b> {data?.ifsc || "HDFC0001234"}
          </p>
        </section>

        {/* RECENT EARNINGS LIST */}
        <section className="form-card">
          <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Delivery Earnings Breakdown</h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (data?.earnings || []).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.earnings.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <strong>{e.order?.trackingNumber || "Order Delivery"}</strong>
                    <br />
                    <small style={{ color: "#777" }}>
                      Gross: ₹{e.grossAmountPaise / 100} • Comm: -₹{e.commissionPaise / 100}
                    </small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ color: "#16a34a" }}>+₹{e.netAmountPaise / 100}</strong>
                    <br />
                    <span style={{ fontSize: "11px", color: "#888" }}>{e.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#777", fontSize: "14px" }}>No earnings recorded yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Earnings;
