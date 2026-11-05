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

function PartnerRegister() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("BIKE");
  const [plateNumber, setPlateNumber] = useState("");
  const [makeModel, setMakeModel] = useState("Honda Activa");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.registerPartner({
        name,
        phone,
        email: email || undefined,
        password,
        vehicleType,
        plateNumber,
        makeModel,
      });
      setUser(res.user);
      navigate("/partner");
    } catch (err) {
      setError(err.message || "Failed to register partner account.");
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

        <h1>Join as Partner</h1>
        <p className="auth-subtitle">Deliver across Nagercoil and Kanniyakumari with NORO.</p>

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
              placeholder="Driver's full name"
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
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <label>Email Address</label>
          <div className="auth-input">
            <Mail size={20} />
            <input
              type="email"
              placeholder="Email address"
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

          <label>Vehicle Type</label>
          <select
            className="form-select"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "14px" }}
          >
            <option value="BIKE">Two-Wheeler (Motorcycle)</option>
            <option value="SCOOTER">Scooter</option>
            <option value="VAN">Delivery Van</option>
          </select>

          <label>License Plate Number</label>
          <div className="auth-input">
            <Truck size={20} />
            <input
              type="text"
              placeholder="e.g. TN-74-AB-1234"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Complete Registration"}
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="register-text">
          Already a partner?
          <button type="button" onClick={() => navigate("/partner/login")}>
            {" "}Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default PartnerRegister;
