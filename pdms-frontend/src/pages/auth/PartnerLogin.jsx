import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function PartnerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("9876500002");
  const [password, setPassword] = useState("Nextus@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(phone, password);
      if (res.user.role !== "PARTNER") {
        setError("This account is not registered as a delivery partner.");
        return;
      }
      navigate("/partner");
    } catch (err) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/NORO.png" alt="NORO" />
        </div>

        <h1>Partner Portal</h1>
        <p className="auth-subtitle">
          NORO delivery partner sign in
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
          <label>Registered Mobile Number</label>
          <div className="auth-input">
            <Phone size={20} />
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <Lock size={20} />
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Partner Sign In"}
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="register-text">
          Want to become a partner?
          <button type="button" onClick={() => navigate("/partner/register")}>
            {" "}Register Vehicle
          </button>
        </p>
      </div>
    </div>
  );
}

export default PartnerLogin;
