import { useState, useEffect } from "react";
import {
  Truck,
  Power,
  Package,
  DollarSign,
  Clock3,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partnerApi, earningsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function PartnerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [earnings, setEarnings] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prof, active, available, earn] = await Promise.all([
          partnerApi.getProfile().catch(() => null),
          partnerApi.getActiveJob().catch(() => null),
          partnerApi.getAvailableJobs().catch(() => []),
          earningsApi.getMyEarnings().catch(() => null),
        ]);

        if (prof) {
          setProfile(prof);
          setIsOnline(prof.isAvailable);
        }
        setActiveJob(active);
        setAvailableCount(available?.length || 0);
        setEarnings(earn);
      } catch (e) {
        console.warn("Failed to load partner dashboard data", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const nextStatus = !isOnline;
      await partnerApi.updateAvailability(nextStatus);
      setIsOnline(nextStatus);
    } catch (err) {
      alert(err.message || "Failed to update availability");
    } finally {
      setToggling(false);
    }
  };

  const partnerName = profile?.user?.name || user?.name || "Raj Kumar";
  const vehicle = profile?.vehicles?.[0];

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Partner Dashboard</h1>
          <p>Welcome, {partnerName}</p>
        </div>

        <button
          onClick={handleToggleOnline}
          disabled={toggling}
          style={{
            background: isOnline ? "#22c55e" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <Power size={16} />
          {toggling ? "Updating..." : isOnline ? "ONLINE" : "OFFLINE"}
        </button>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {/* KYC STATUS BADGE IF NOT APPROVED */}
        {profile?.kycStatus !== "APPROVED" && (
          <div
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: "12px 16px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} />
              <span>KYC Status: <b>{profile?.kycStatus || "PENDING"}</b></span>
            </div>
            <button
              onClick={() => navigate("/partner/kyc")}
              style={{
                background: "#d97706",
                color: "#fff",
                border: "none",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Upload Docs
            </button>
          </div>
        )}

        {/* ACTIVE DELIVERY BANNER */}
        {activeJob ? (
          <section
            className="form-card"
            style={{ borderLeft: "5px solid #ed1c24", cursor: "pointer" }}
            onClick={() => navigate("/partner/active")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ed1c24", textTransform: "uppercase" }}>
                ● Active Delivery Task
              </span>
              <span className="status-badge">{activeJob.status.replace("_", " ")}</span>
            </div>

            <h2 style={{ fontSize: "17px", margin: "4px 0" }}>{activeJob.trackingNumber}</h2>
            <p style={{ color: "#555", fontSize: "14px", margin: "6px 0" }}>
              <b>Pickup:</b> {activeJob.pickupAddress.split(",")[0]} <br />
              <b>Drop:</b> {activeJob.dropAddress.split(",")[0]}
            </p>

            <button
              className="continue-btn"
              style={{ marginTop: "12px", padding: "10px" }}
              onClick={() => navigate("/partner/active")}
            >
              Open Active Task
              <ChevronRight size={18} />
            </button>
          </section>
        ) : (
          <section className="form-card" style={{ textAlign: "center", padding: "20px" }}>
            <Truck size={36} color="#ffd21f" style={{ margin: "0 auto 8px" }} />
            <h3 style={{ margin: "4px 0" }}>No Active Task</h3>
            <p style={{ color: "#777", fontSize: "14px", marginBottom: "14px" }}>
              {isOnline
                ? `${availableCount} delivery jobs are waiting in your area`
                : "You are currently offline. Go online to receive delivery requests."}
            </p>
            {isOnline && (
              <button
                className="continue-btn"
                onClick={() => navigate("/partner/requests")}
              >
                View Available Jobs ({availableCount})
              </button>
            )}
          </section>
        )}

        {/* EARNINGS SUMMARY */}
        <section
          className="form-card"
          style={{ cursor: "pointer", marginTop: "16px" }}
          onClick={() => navigate("/partner/earnings")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#777", fontSize: "13px" }}>Total Earnings</span>
              <h2 style={{ fontSize: "24px", color: "#16a34a", margin: "4px 0" }}>
                ₹{earnings ? earnings.totalEarnedRupees : 0}
              </h2>
              <small style={{ color: "#555" }}>
                Pending Payout: ₹{earnings ? earnings.pendingSettlementRupees : 0}
              </small>
            </div>
            <ChevronRight size={22} color="#888" />
          </div>
        </section>

        {/* QUICK MENU */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
          <div
            className="form-card"
            style={{ textAlign: "center", cursor: "pointer", padding: "16px" }}
            onClick={() => navigate("/partner/requests")}
          >
            <Package size={28} color="#ffd21f" style={{ margin: "0 auto 8px" }} />
            <strong style={{ display: "block" }}>Job Requests</strong>
            <small style={{ color: "#666" }}>{availableCount} available</small>
          </div>

          <div
            className="form-card"
            style={{ textAlign: "center", cursor: "pointer", padding: "16px" }}
            onClick={() => navigate("/partner/history")}
          >
            <Clock3 size={28} color="#ed1c24" style={{ margin: "0 auto 8px" }} />
            <strong style={{ display: "block" }}>Delivery History</strong>
            <small style={{ color: "#666" }}>Past deliveries</small>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PartnerHome;
