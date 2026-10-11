import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/client";

function Partners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getPartners();
      setPartners(list || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleUpdateKyc = async (partnerId, status) => {
    const reason = status === "REJECTED" ? prompt("Enter reason for rejection:") : undefined;
    if (status === "REJECTED" && !reason) return;

    setUpdatingId(partnerId);
    try {
      await adminApi.updateKyc(partnerId, status, reason);
      alert(`Partner KYC set to ${status}!`);
      await fetchPartners();
    } catch (err) {
      alert(err.message || "Failed to update KYC");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Delivery Partners</h1>
          <p>KYC Verification & Fleet Management</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : partners.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {partners.map((p) => (
              <div key={p.id} className="form-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <strong style={{ fontSize: "16px" }}>{p.user?.name}</strong>
                    <br />
                    <small style={{ color: "#666" }}>{p.user?.phone} • {p.user?.email || "No email"}</small>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: p.kycStatus === "APPROVED" ? "#dcfce7" : p.kycStatus === "REJECTED" ? "#fee2e2" : "#fef3c7",
                      color: p.kycStatus === "APPROVED" ? "#166534" : p.kycStatus === "REJECTED" ? "#991b1b" : "#92400e",
                      fontWeight: "bold",
                    }}
                  >
                    {p.kycStatus}
                  </span>
                </div>

                {/* VEHICLES */}
                <div style={{ background: "#f8f9fa", padding: "8px 12px", borderRadius: "8px", margin: "8px 0", fontSize: "13px" }}>
                  <b>Registered Vehicle:</b>{" "}
                  {p.vehicles?.length > 0
                    ? `${p.vehicles[0].make} ${p.vehicles[0].model} (${p.vehicles[0].plateNumber})`
                    : "None added"}
                </div>

                {/* DOCUMENTS */}
                <div style={{ margin: "8px 0", fontSize: "13px" }}>
                  <b>Documents ({p.documents?.length || 0}):</b>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {(p.documents || []).map((d) => (
                      <span key={d.id} style={{ background: "#e5e7eb", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        {d.docType}: {d.documentNumber}
                      </span>
                    ))}
                  </div>
                </div>

                {/* KYC ACTIONS */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {p.kycStatus !== "APPROVED" && (
                    <button
                      onClick={() => handleUpdateKyc(p.id, "APPROVED")}
                      disabled={updatingId === p.id}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#22c55e",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Approve KYC
                    </button>
                  )}
                  {p.kycStatus !== "REJECTED" && (
                    <button
                      onClick={() => handleUpdateKyc(p.id, "REJECTED")}
                      disabled={updatingId === p.id}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Reject KYC
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No partners registered.</p>
        )}
      </main>
    </div>
  );
}

export default Partners;
