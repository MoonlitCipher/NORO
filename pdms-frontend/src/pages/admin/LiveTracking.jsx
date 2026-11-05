import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Loader2,
  Navigation,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/client";

function LiveTracking() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActive() {
      setLoading(true);
      try {
        const list = await adminApi.getLiveTracking();
        setDeliveries(list || []);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    loadActive();
  }, []);

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Live Operations Map</h1>
          <p>Fleet tracking & real-time delivery status</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : deliveries.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {deliveries.map((del) => {
              const latestLoc = del.trackingPoints?.[0];
              return (
                <div key={del.id} className="form-card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "16px" }}>{del.trackingNumber}</strong>
                    <span className="details-live-badge">● LIVE</span>
                  </div>

                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#444" }}>
                    <b>Current Status:</b> {del.status.replace("_", " ")}
                  </p>

                  <div style={{ fontSize: "13px", color: "#555", margin: "6px 0" }}>
                    Partner: <b>{del.partner?.user?.name || "Assigned Partner"}</b> ({del.partner?.vehicles?.[0]?.plateNumber || "Bike"}) <br />
                    Customer: <b>{del.customer?.name}</b> ({del.customer?.phone})
                  </div>

                  {latestLoc && (
                    <div style={{ background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", margin: "8px 0", fontSize: "12px", color: "#166534" }}>
                      <><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 4 }} aria-hidden="true" /> Last GPS: {latestLoc.latitude.toFixed(4)}, {latestLoc.longitude.toFixed(4)} ({latestLoc.speed || 0} km/h)</>
                    </div>
                  )}

                  <button
                    className="continue-btn"
                    style={{ marginTop: "8px", padding: "8px" }}
                    onClick={() => navigate(`/customer/track?id=${del.trackingNumber}`)}
                  >
                    Open Live Timeline
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "16px" }}>
            <Truck size={40} color="#888" style={{ margin: "0 auto 12px" }} />
            <h3>No Deliveries in Transit</h3>
            <p style={{ color: "#666" }}>Currently there are no parcels on the road.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default LiveTracking;
