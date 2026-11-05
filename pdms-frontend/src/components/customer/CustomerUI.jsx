import { ArrowLeft, Box, History, Home, Plus, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../customer/customer.css";

export function NoroMark({ compact = false }) { return <div className={`noro-mark ${compact ? "compact" : ""}`}><img src="/NORO.png" alt="NORO" /></div>; }

export function PageHeader({ eyebrow = "NORO CUSTOMER", title, back = "/customer", action }) {
  const navigate = useNavigate();
  return <header className="page-header"><button className="icon-button" aria-label="Go back" onClick={() => navigate(back)}><ArrowLeft size={20} /></button><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action || <div className="header-spacer" />}</header>;
}

export function BottomNav() {
  const navigate = useNavigate(); const { pathname } = useLocation();
  const items = [["/customer", Home, "Home"], ["/customer/book", Plus, "Book"], ["/customer/orders", History, "Orders"], ["/customer/profile", UserRound, "Profile"]];
  return <nav className="bottom-nav" aria-label="Customer navigation">{items.map(([path, Icon, label]) => { const active = path === "/customer" ? pathname === path : pathname.startsWith(path); return <button key={path} className={active ? "active" : ""} onClick={() => navigate(path)}><Icon size={20} /><span>{label}</span></button>; })}</nav>;
}

export function CustomerShell({ children, nav = true, className = "" }) { return <div className={`customer-app ${className}`}><div className="customer-frame">{children}</div>{nav && <BottomNav />}</div>; }
export function SectionTitle({ title, action, onAction }) { return <div className="section-title"><h2>{title}</h2>{action && <button onClick={onAction}>{action}</button>}</div>; }

export function OrderCard({ order, compact = false }) {
  const navigate = useNavigate(); const tone = order.status.toLowerCase().replace(" ", "-");
  return <button className={`order-card ${compact ? "compact" : ""}`} onClick={() => navigate(`/customer/order/${order.id}`)}><span className="order-icon"><Box size={20} /></span><span className="order-copy"><strong>{order.from} <span>→</span> {order.to}</strong><small>{order.id} · {order.date}</small></span><span className="order-meta"><strong>₹{order.price}</strong><em className={tone}>{order.status}</em></span></button>;
}

export function BookingProgress({ step, total = 3 }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="booking-progress" aria-label={`Booking step ${step} of ${total}`}>
      {steps.map((n) => (
        <span key={n} className={n <= step ? "done" : ""} />
      ))}
    </div>
  );
}
export function AddressRoute({ pickup, destination }) { return <div className="address-route"><div><span className="route-dot pickup" /><p><small>Pickup</small><strong>{pickup || "Choose pickup location"}</strong></p></div><i /><div><span className="route-dot destination" /><p><small>Drop-off</small><strong>{destination || "Choose destination"}</strong></p></div></div>; }

