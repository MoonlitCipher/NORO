import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("9876500000");
  const [password, setPassword] = useState("Admin@123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.user.role !== "ADMIN" && res.user.role !== "OPERATIONS") {
        setError("Access restricted. This account does not possess administrator privileges.");
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Invalid administrator credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ background: "#171717", color: "#ffd21f" }}>
          <ShieldAlert size={38} />
        </div>

        <h1>Operations Console</h1>
        <p className="auth-subtitle">
          Nextus Administrator & Dispatch Control
        </p>

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "10px 14px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            marginBottom: "16px",
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Admin Phone or Email</label>
          <div className="auth-input">
            <Phone size={20} />
            <input
              type="text"
              placeholder="Admin identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <label>Security Password</label>
          <div className="auth-input">
            <Lock size={20} />
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading} style={{ background: "#171717", color: "#ffd21f" }}>
            {loading ? "Authenticating..." : "Sign In to Console"}
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
