import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ordersApi } from "../../api/client";

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await ordersApi.list();
        setOrderCount(res?.total || res?.orders?.length || 0);
      } catch (e) {
        console.warn(e);
      }
    }
    fetchStats();
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      navigate("/customer/login");
    }
  };

  const name = user?.name || "Devi Kumar";
  const phone = user?.phone || "+91 98765 43210";
  const email = user?.email || "customer@example.com";

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
          <h1>My Account</h1>
          <p>Manage your profile and settings</p>
        </div>
      </header>

      <main className="profile-page">
        {/* PROFILE CARD */}
        <section className="profile-card">
          <div className="profile-avatar">
            <User size={32} />
          </div>

          <div className="profile-info">
            <h2>{name}</h2>
            <p>{user?.role || "Customer"}</p>
          </div>

          <button
            className="edit-profile-btn"
            onClick={() => {
              const newName = prompt("Enter new name:", name);
              if (newName) alert("Profile updated!");
            }}
          >
            Edit
          </button>
        </section>

        {/* CONTACT INFORMATION */}
        <section className="profile-section">
          <h2>Personal Information</h2>

          <div className="profile-info-row">
            <div className="profile-row-icon">
              <Phone size={18} />
            </div>

            <div>
              <small>Mobile Number</small>
              <strong>{phone}</strong>
            </div>
          </div>

          <div className="profile-info-row">
            <div className="profile-row-icon">
              <Mail size={18} />
            </div>

            <div>
              <small>Email Address</small>
              <strong>{email}</strong>
            </div>
          </div>

          <div className="profile-info-row">
            <div className="profile-row-icon">
              <MapPin size={18} />
            </div>

            <div>
              <small>Default City</small>
              <strong>Nagercoil, Tamil Nadu</strong>
            </div>
          </div>
        </section>

        {/* QUICK MENU */}
        <section className="profile-section">
          <h2>Activity & Settings</h2>

          <div
            className="profile-menu-item"
            onClick={() => navigate("/customer/orders")}
            style={{ cursor: "pointer" }}
          >
            <div className="profile-menu-icon">
              <Package size={20} />
            </div>

            <div className="profile-menu-text">
              <strong>Order History</strong>
              <span>{orderCount} parcels dispatched</span>
            </div>

            <ChevronRight size={18} />
          </div>

          <div
            className="profile-menu-item"
            onClick={() => navigate("/customer/addresses")}
            style={{ cursor: "pointer" }}
          >
            <div className="profile-menu-icon">
              <MapPin size={20} />
            </div>

            <div className="profile-menu-text">
              <strong>Saved Addresses</strong>
              <span>Manage delivery addresses</span>
            </div>

            <ChevronRight size={18} />
          </div>

          <div
            className="profile-menu-item"
            onClick={() => navigate("/customer/notifications")}
            style={{ cursor: "pointer" }}
          >
            <div className="profile-menu-icon">
              <Bell size={20} />
            </div>

            <div className="profile-menu-text">
              <strong>Notifications</strong>
              <span>Updates and promotions</span>
            </div>

            <ChevronRight size={18} />
          </div>

          <div
            className="profile-menu-item logout"
            onClick={handleLogout}
            style={{ cursor: "pointer", color: "#ed1c24" }}
          >
            <div className="profile-menu-icon" style={{ color: "#ed1c24" }}>
              <LogOut size={20} />
            </div>

            <div className="profile-menu-text">
              <strong style={{ color: "#ed1c24" }}>Log Out</strong>
              <span>Sign out of your account</span>
            </div>

            <ChevronRight size={18} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;