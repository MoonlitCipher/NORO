import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  Phone,
  MessageCircle,
  Check,
  Clock3,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ordersApi } from "../../api/client";

function TrackDelivery() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const paramId = queryParams.get("id") || "PDMS-10246";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTracking() {
      setLoading(true);
      try {
        const data = await ordersApi.track(paramId);
        setOrder(data);
      } catch (err) {
        console.warn("Could not track order directly, loading demo data", err);
      } finally {
        setLoading(false);
      }
    }

    loadTracking();
  }, [paramId]);

  const trackingData = order || {
    trackingNumber: paramId,
    status: "IN_TRANSIT",
    pickupAddress: "Parvathipuram, Nagercoil",
    dropAddress: "Tower Junction, Nagercoil",
    estimatedDurationMins: 18,
    partner: {
      user: { name: "Raj Kumar", phone: "9876500002" },
      rating: 4.8,
      totalDeliveries: 326,
    },
    events: [
      {
        title: "Booking Confirmed",
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
      {
        title: "Pickup Completed",
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        title: "Parcel In Transit",
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
  };

  const partnerName = trackingData.partner?.user?.name || "Raj Kumar";
  const partnerPhone = trackingData.partner?.user?.phone || "+91 98765 00002";
  const partnerRating = trackingData.partner?.rating || 4.8;
  const partnerDeliveries = trackingData.partner?.totalDeliveries || 326;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/customer")}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <h1>Track Delivery</h1>
          <p>Follow your parcel in real time</p>
        </div>
      </header>

      <main className="tracking-page">
        {/* ORDER STATUS */}
        <section className="tracking-status-card">
          <div className="tracking-status-top">
            <div>
              <span>Booking ID</span>
              <strong>{trackingData.trackingNumber}</strong>
            </div>

            <span className="status-badge">
              {trackingData.status.replace("_", " ")}
            </span>
          </div>

          <div className="tracking-route-text">
            <div>
              <small>From</small>
              <strong>{trackingData.pickupAddress.split(",")[0]}</strong>
            </div>

            <span>→</span>

            <div>
              <small>To</small>
              <strong>{trackingData.dropAddress.split(",")[0]}</strong>
            </div>
          </div>
        </section>

        {/* MAP */}
        <section className="tracking-map">
          <div className="map-grid"></div>
          <div className="map-route"></div>

          <div className="map-pin pickup-map-pin">
            <MapPin size={20} />
          </div>

          <div className="delivery-vehicle">
            <Truck size={25} />
          </div>

          <div className="map-pin destination-map-pin">
            <MapPin size={20} />
          </div>

          <div className="map-label pickup-label">Pickup</div>
          <div className="map-label destination-label">Destination</div>
        </section>

        {/* ETA */}
        <section className="eta-card">
          <div className="eta-icon">
            <Clock3 size={24} />
          </div>

          <div>
            <span>Estimated Arrival</span>
            <strong>{trackingData.estimatedDurationMins || 18} minutes</strong>
          </div>

          <div className="eta-live">● LIVE</div>
        </section>

        {/* DELIVERY PARTNER */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Truck size={21} />
            </div>

            <div>
              <h2>Delivery Partner</h2>
              <p>Your parcel is currently with the partner</p>
            </div>
          </div>

          <div className="partner-card">
            <div className="partner-avatar">
              {partnerName.split(" ").map((n) => n[0]).join("")}
            </div>

            <div className="partner-details">
              <strong>{partnerName}</strong>
              <span>PDMS Delivery Partner</span>
              <small>⭐ {partnerRating} • {partnerDeliveries} deliveries</small>
            </div>
          </div>

          <div className="partner-actions">
            <button onClick={() => window.open(`tel:${partnerPhone}`)}>
              <Phone size={18} />
              Call
            </button>

            <button onClick={() => alert(`Messaging ${partnerName} via PDMS Chat`)}>
              <MessageCircle size={18} />
              Message
            </button>
          </div>
        </section>

        {/* DELIVERY TIMELINE */}
        <section className="form-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Package size={21} />
            </div>

            <div>
              <h2>Delivery Status</h2>
              <p>Current delivery progress</p>
            </div>
          </div>

          <div className="tracking-timeline">
            {(trackingData.events || []).map((ev, idx) => (
              <div key={ev.id || idx} className="timeline-item completed">
                <div className="timeline-icon">
                  <Check size={16} />
                </div>

                <div>
                  <strong>{ev.title}</strong>
                  <span>
                    {new Date(ev.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {trackingData.status !== "DELIVERED" && (
              <div className="timeline-item">
                <div className="timeline-icon">
                  <MapPin size={16} />
                </div>

                <div>
                  <strong>Delivered</strong>
                  <span>Estimated {trackingData.estimatedDurationMins || 18} mins</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default TrackDelivery;