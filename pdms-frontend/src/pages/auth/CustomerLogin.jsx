import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("9876543210");
  const [password, setPassword] = useState("Nextus@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(phone, password);
      navigate("/customer");
    } catch (err) {
      setError(err.message || "Invalid phone number or password");
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

        <h1>Welcome to NORO</h1>
        <p className="auth-subtitle">
          Delivery made easy across Nagercoil and Kanniyakumari.
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
          <label>Mobile Number</label>
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

          <div className="forgot-row">
            <button type="button" onClick={() => alert("Please contact support to reset your password.")}>
              Forgot Password?
            </button>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <p className="register-text">
          Don't have an account?
          <button type="button" onClick={() => navigate("/customer/register")}>
            {" "}Create Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default CustomerLogin;
