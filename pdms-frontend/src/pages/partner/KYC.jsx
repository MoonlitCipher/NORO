import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partnerApi } from "../../api/client";

function KYC() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [docType, setDocType] = useState("DRIVING_LICENSE");
  const [documentNumber, setDocumentNumber] = useState("");
  const [fileUrl, setFileUrl] = useState("/uploads/docs/license-sample.jpg");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await partnerApi.getProfile();
      setProfile(res);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await partnerApi.submitDocument({
        docType,
        documentNumber,
        fileUrl,
      });
      alert("Document submitted for verification!");
      setDocumentNumber("");
      await loadProfile();
    } catch (err) {
      alert(err.message || "Failed to submit document");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/partner")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>KYC & Verification</h1>
          <p>Partner compliance documents</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {/* STATUS CARD */}
        <div className="form-card" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={28} color={profile?.kycStatus === "APPROVED" ? "#16a34a" : "#d97706"} />
            <div>
              <h2 style={{ fontSize: "16px", margin: 0 }}>
                Verification Status: <b>{profile?.kycStatus || "PENDING"}</b>
              </h2>
              <small style={{ color: "#666" }}>
                {profile?.kycStatus === "APPROVED"
                  ? "Your account is fully verified for deliveries"
                  : "Submit required government ID and driving license for activation"}
              </small>
            </div>
          </div>
        </div>

        {/* SUBMIT DOCUMENT FORM */}
        <form className="form-card" onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Submit Document</h2>

          <label className="field-label">Document Type</label>
          <select
            className="form-select"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "14px" }}
          >
            <option value="DRIVING_LICENSE">Driving License (DL)</option>
            <option value="ID_PROOF">Government ID (Aadhaar / Passport)</option>
            <option value="VEHICLE_RC">Vehicle Registration Certificate (RC)</option>
          </select>

          <label className="field-label">Document Number</label>
          <input
            type="text"
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "16px" }}
            placeholder="e.g. DL-TN-2023001234"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            required
          />

          <button className="continue-btn" type="submit" disabled={submitting}>
            {submitting ? "Uploading..." : "Submit for Verification"}
          </button>
        </form>

        {/* SUBMITTED DOCUMENTS */}
        <section className="form-card">
          <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>Submitted Documents</h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (profile?.documents || []).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {profile.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <strong>{doc.docType.replace("_", " ")}</strong>
                    <br />
                    <small style={{ color: "#666" }}>{doc.documentNumber}</small>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: doc.verificationStatus === "VERIFIED" ? "#dcfce7" : "#fef3c7",
                      color: doc.verificationStatus === "VERIFIED" ? "#166534" : "#92400e",
                      fontWeight: "bold",
                    }}
                  >
                    {doc.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#777", fontSize: "14px" }}>No documents uploaded yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default KYC;
