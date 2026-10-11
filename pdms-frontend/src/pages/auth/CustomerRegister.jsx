import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { authApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function CustomerRegister() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.registerCustomer({
        name,
        phone,
        email: email || undefined,
        password,
      });
      setUser(res.user);
      navigate("/customer");
    } catch (err) {
      setError(err.message || "Failed to create account. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Truck size={38} />
        </div>

        <h1>Create Account</h1>
        <p className="auth-subtitle">
          Start sending parcels with PDMS
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
          <label>Full Name</label>
          <div className="auth-input">
            <User size={20} />
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <label>Email</label>
          <div className="auth-input">
            <Mail size={20} />
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <Lock size={20} />
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="register-text">
          Already have an account?
          <button type="button" onClick={() => navigate("/customer/login")}>
            {" "}Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default CustomerRegister;