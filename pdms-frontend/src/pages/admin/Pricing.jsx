import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sliders,
  DollarSign,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pricingApi } from "../../api/client";

function Pricing() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const list = await pricingApi.getRules();
      setRules(list || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleStartEdit = (rule) => {
    setEditingId(rule.id);
    setEditForm({
      baseFareRupees: rule.baseFarePaise / 100,
      perKmRupees: rule.perKmPaise / 100,
      perKgRupees: rule.perKgPaise / 100,
      minFareRupees: rule.minFarePaise / 100,
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await pricingApi.updateRule(id, {
        baseFarePaise: Math.round(Number(editForm.baseFareRupees) * 100),
        perKmPaise: Math.round(Number(editForm.perKmRupees) * 100),
        perKgPaise: Math.round(Number(editForm.perKgRupees) * 100),
        minFarePaise: Math.round(Number(editForm.minFareRupees) * 100),
      });
      alert("Pricing rule updated successfully!");
      setEditingId(null);
      await fetchRules();
    } catch (e) {
      alert(e.message || "Failed to update pricing rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>Pricing Configuration</h1>
          <p>Rate calculation rules & vehicle tiers</p>
        </div>
      </header>

      <main className="form-page" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {rules.map((rule) => {
              const isEditing = editingId === rule.id;
              return (
                <div key={rule.id} className="form-card" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "16px" }}>{rule.name}</strong>
                    <span style={{ fontSize: "12px", background: "#e5e7eb", padding: "2px 8px", borderRadius: "4px" }}>
                      {rule.vehicleType} • {rule.deliverySpeed}
                    </span>
                  </div>

                  {isEditing ? (
                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "12px", color: "#666" }}>Base Fare (₹)</label>
                      <input
                        type="number"
                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                        value={editForm.baseFareRupees}
                        onChange={(e) => setEditForm({ ...editForm, baseFareRupees: e.target.value })}
                      />

                      <label style={{ fontSize: "12px", color: "#666" }}>Rate per KM (₹)</label>
                      <input
                        type="number"
                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                        value={editForm.perKmRupees}
                        onChange={(e) => setEditForm({ ...editForm, perKmRupees: e.target.value })}
                      />

                      <label style={{ fontSize: "12px", color: "#666" }}>Rate per KG (₹)</label>
                      <input
                        type="number"
                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                        value={editForm.perKgRupees}
                        onChange={(e) => setEditForm({ ...editForm, perKgRupees: e.target.value })}
                      />

                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          onClick={() => handleSave(rule.id)}
                          disabled={saving}
                          style={{
                            flex: 1,
                            padding: "8px",
                            background: "#22c55e",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: "8px 14px", background: "#eee", border: "none", borderRadius: "6px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", color: "#555", margin: "10px 0" }}>
                        <div>Base Fare: <b>₹{rule.baseFarePaise / 100}</b></div>
                        <div>Base Distance: <b>{rule.baseDistanceKm} KM</b></div>
                        <div>Per KM: <b>₹{rule.perKmPaise / 100}</b></div>
                        <div>Per KG: <b>₹{rule.perKgPaise / 100}</b></div>
                      </div>

                      <button
                        onClick={() => handleStartEdit(rule)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          background: "#ffd21f",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          marginTop: "6px",
                        }}
                      >
                        Edit Rule
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Pricing;
