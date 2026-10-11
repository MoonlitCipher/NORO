import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../api/client";

function Addresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [label, setLabel] = useState("Home");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Nagercoil");
  const [postalCode, setPostalCode] = useState("629001");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const list = await usersApi.getAddresses();
      setAddresses(list || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersApi.addAddress({
        label,
        street,
        area,
        city,
        postalCode,
        isDefault,
      });
      setShowAddForm(false);
      setStreet("");
      setArea("");
      await fetchAddresses();
    } catch (err) {
      alert(err.message || "Failed to add address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this address?")) {
      try {
        await usersApi.deleteAddress(id);
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await usersApi.setDefaultAddress(id);
      await fetchAddresses();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/customer")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Saved Addresses</h1>
          <p>Manage pickup and delivery locations</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        <button
          className="continue-btn"
          style={{ marginBottom: "16px", background: "#ffd21f", color: "#171717" }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={20} />
          {showAddForm ? "Cancel" : "Add New Address"}
        </button>

        {showAddForm && (
          <form className="form-card" onSubmit={handleAdd} style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>New Address</h2>

            <label className="field-label">Label (e.g. Home, Office)</label>
            <input
              type="text"
              className="auth-input"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "12px" }}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />

            <label className="field-label">Street / House Number</label>
            <input
              type="text"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "12px" }}
              placeholder="e.g. 42 South Car Street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />

            <label className="field-label">Area / Locality</label>
            <input
              type="text"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "12px" }}
              placeholder="e.g. Parvathipuram"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />

            <label className="field-label">Postal Code</label>
            <input
              type="text"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "16px" }}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />

            <button className="continue-btn" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Address"}
            </button>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={30} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "16px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <MapPin size={18} color="#ed1c24" />
                    <strong>{addr.label}</strong>
                    {addr.isDefault && (
                      <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px" }}>
                        Default
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "4px 0", color: "#444", fontSize: "14px" }}>
                    {addr.street}, {addr.area}
                  </p>
                  <small style={{ color: "#777" }}>
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </small>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
                      title="Set as default"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ed1c24" }}
                    title="Delete address"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Addresses;
