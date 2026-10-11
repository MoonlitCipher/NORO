import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  Package,
  CheckCircle,
  Clock3,
  Loader2,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partnerApi } from "../../api/client";

function ActiveDelivery() {
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [proofNotes, setProofNotes] = useState("");

  const loadJob = async () => {
    setLoading(true);
    try {
      const job = await partnerApi.getActiveJob();
      setActiveJob(job);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, []);

  const handlePickup = async () => {
    setActing(true);
    try {
      await partnerApi.pickupOrder(activeJob.id);
      alert("Pickup confirmed!");
      await loadJob();
    } catch (e) {
      alert(e.message);
    } finally {
      setActing(false);
    }
  };

  const handleInTransit = async () => {
    setActing(true);
    try {
      await partnerApi.inTransitOrder(activeJob.id);
      alert("In transit update broadcasted!");
      await loadJob();
    } catch (e) {
      alert(e.message);
    } finally {
      setActing(false);
    }
  };

  const handleDeliver = async () => {
    const notes = prompt("Enter proof of delivery notes:", proofNotes || "Handed over to customer");
    if (!notes) return;

    setActing(true);
    try {
      await partnerApi.completeDelivery(activeJob.id, {
        proofUrl: "/uploads/pod/delivery-signature.jpg",
        notes,
      });
      alert("Delivery completed successfully! Earning credited to your wallet.");
      navigate("/partner/earnings");
    } catch (e) {
      alert(e.message);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="app" style={{ textAlign: "center", padding: "60px" }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 10px" }} />
        <p>Loading active delivery...</p>
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="app">
        <header className="page-header">
          <button className="back-btn" onClick={() => navigate("/partner")}>
            <ArrowLeft size={21} />
          </button>
          <div>
            <h1>Active Delivery</h1>
            <p>Task status</p>
          </div>
        </header>

        <main className="form-page" style={{ padding: "40px 20px", textAlign: "center" }}>
          <Package size={48} color="#888" style={{ margin: "0 auto 12px" }} />
          <h3>No Active Delivery</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            You do not currently have any deliveries in progress.
          </p>
          <button className="continue-btn" onClick={() => navigate("/partner/requests")}>
            Browse Available Jobs
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/partner")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Active Delivery</h1>
          <p>{activeJob.trackingNumber}</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {/* STATUS CARD */}
        <div className="details-status-card" style={{ marginBottom: "16px" }}>
          <div className="details-status-icon">
            <Truck size={26} />
          </div>
          <div className="details-status-content">
            <strong>{activeJob.status.replace("_", " ")}</strong>
            <span>Active Assignment</span>
          </div>
          <span className="details-live-badge">LIVE</span>
        </div>

        {/* ROUTE */}
        <section className="form-card" style={{ marginBottom: "16px" }}>
          <div className="card-heading">
            <div className="card-heading-icon">
              <MapPin size={21} />
            </div>
            <div>
              <h2>Route Details</h2>
              <p>Follow delivery addresses</p>
            </div>
          </div>

          <div style={{ marginBottom: "12px", borderLeft: "2px dashed #ddd", paddingLeft: "14px", marginLeft: "6px" }}>
            <div style={{ marginBottom: "16px" }}>
              <small style={{ color: "#ed1c24", fontWeight: "bold" }}>PICKUP</small>
              <p style={{ margin: "2px 0", fontWeight: "600" }}>{activeJob.pickupAddress}</p>
              <small style={{ color: "#666" }}>
                Contact: {activeJob.pickupContactName} • {activeJob.pickupContactPhone}
              </small>
            </div>

            <div>
              <small style={{ color: "#22c55e", fontWeight: "bold" }}>DESTINATION</small>
              <p style={{ margin: "2px 0", fontWeight: "600" }}>{activeJob.dropAddress}</p>
              <small style={{ color: "#666" }}>
                Contact: {activeJob.dropContactName} • {activeJob.dropContactPhone}
              </small>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <button
              onClick={() => window.open(`tel:${activeJob.pickupContactPhone}`)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Phone size={16} /> Call Sender
            </button>
            <button
              onClick={() => window.open(`tel:${activeJob.dropContactPhone}`)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Phone size={16} /> Call Receiver
            </button>
          </div>
        </section>

        {/* PACKAGE DETAILS */}
        <section className="form-card" style={{ marginBottom: "20px" }}>
          <div className="card-heading">
            <div className="card-heading-icon">
              <Package size={21} />
            </div>
            <div>
              <h2>Parcel Details</h2>
              <p>{activeJob.packageType} • {activeJob.packageWeightKg} KG</p>
            </div>
          </div>

          {activeJob.specialInstructions && (
            <p style={{ background: "#fffbeb", padding: "10px", borderRadius: "8px", color: "#b45309", fontSize: "13px" }}>
              <b>Note:</b> {activeJob.specialInstructions}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontWeight: "bold" }}>
            <span>Earning on Delivery:</span>
            <span style={{ color: "#16a34a" }}>₹{(activeJob.fareTotalPaise * 0.8) / 100}</span>
          </div>
        </section>

        {/* ACTION BUTTONS BASED ON STATE */}
        {activeJob.status === "ASSIGNED" && (
          <button
            className="continue-btn"
            style={{ background: "#ffd21f", color: "#171717", fontWeight: "bold" }}
            disabled={acting}
            onClick={handlePickup}
          >
            {acting ? "Confirming..." : "Confirm Parcel Pickup"}
          </button>
        )}

        {activeJob.status === "PICKED_UP" && (
          <button
            className="continue-btn"
            style={{ background: "#ed1c24", color: "#fff" }}
            disabled={acting}
            onClick={handleInTransit}
          >
            {acting ? "Updating..." : "Start Delivery (In Transit)"}
          </button>
        )}

        {["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(activeJob.status) && (
          <button
            className="continue-btn"
            style={{ background: "#22c55e", color: "#fff" }}
            disabled={acting}
            onClick={handleDeliver}
          >
            <CheckCircle size={20} />
            {acting ? "Completing..." : "Complete Delivery & POD"}
          </button>
        )}
      </main>
    </div>
  );
}

export default ActiveDelivery;
