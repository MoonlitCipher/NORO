import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partnerApi, dispatchApi } from "../../api/client";

function DeliveryRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const list = await partnerApi.getAvailableJobs();
      setRequests(list || []);
    } catch (e) {
      console.warn("Failed to load available jobs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAccept = async (orderId) => {
    setClaimingId(orderId);
    try {
      await dispatchApi.acceptJob(orderId);
      alert("Job claimed successfully! You are now assigned to this delivery.");
      navigate("/partner/active");
    } catch (err) {
      alert(err.message || "Failed to claim job. It may have been taken by another partner.");
      await fetchJobs();
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="app">
      <header className="page-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="back-btn" onClick={() => navigate("/partner")}>
            <ArrowLeft size={21} />
          </button>
          <div>
            <h1>Available Delivery Jobs</h1>
            <p>Pick up nearby customer parcels</p>
          </div>
        </div>

        <button
          onClick={fetchJobs}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#171717" }}
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 10px" }} />
            <p>Finding available delivery jobs...</p>
          </div>
        ) : requests.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {requests.map((job) => (
              <div key={job.id} className="form-card" style={{ borderTop: "4px solid #ffd21f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "16px" }}>{job.trackingNumber}</strong>
                  <span style={{ fontSize: "15px", fontWeight: "bold", color: "#16a34a" }}>
                    ₹{job.fareTotalPaise / 100}
                  </span>
                </div>

                <div style={{ marginBottom: "12px", fontSize: "14px", color: "#444" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <MapPin size={16} color="#ed1c24" />
                    <span><b>Pickup:</b> {job.pickupAddress}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={16} color="#22c55e" />
                    <span><b>Destination:</b> {job.dropAddress}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666", marginBottom: "16px" }}>
                  <span>{job.packageType} ({job.packageWeightKg} KG)</span>
                  <span>{job.deliverySpeed} • ~{job.estimatedDurationMins || 20} mins</span>
                </div>

                <button
                  className="continue-btn"
                  style={{ background: "#ffd21f", color: "#171717", fontWeight: "bold" }}
                  disabled={claimingId === job.id}
                  onClick={() => handleAccept(job.id)}
                >
                  {claimingId === job.id ? "Claiming Job..." : "Accept Job"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "16px" }}>
            <Package size={44} color="#888" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ margin: "4px 0" }}>No Open Requests</h3>
            <p style={{ color: "#777", fontSize: "14px" }}>
              All parcels in your region are currently assigned or completed. Check back in a few minutes!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DeliveryRequests;
