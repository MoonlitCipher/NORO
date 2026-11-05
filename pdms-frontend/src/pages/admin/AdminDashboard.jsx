import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Sliders,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboard.css";

const modules = [
  {
    title: "Partner approvals",
    description: "Review driver documents and KYC status",
    icon: Users,
    href: "/admin/partners",
    tone: "amber",
  },
  {
    title: "Orders & dispatch",
    description: "Manage deliveries and assign partners",
    icon: Package,
    href: "/admin/orders",
    tone: "blue",
  },
  {
    title: "Live fleet",
    description: "View active deliveries and partner locations",
    icon: MapPin,
    href: "/admin/tracking",
    tone: "red",
  },
  {
    title: "Pricing rules",
    description: "Configure base fares and distance rates",
    icon: Sliders,
    href: "/admin/pricing",
    tone: "purple",
  },
  {
    title: "Settlements",
    description: "Review and process partner payouts",
    icon: CreditCard,
    href: "/admin/settlements",
    tone: "green",
  },
];

const numberFormat = new Intl.NumberFormat("en-IN");
const formatCount = (value) => numberFormat.format(Number(value) || 0);
const formatRupees = (value) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.getDashboard());
    } catch (err) {
      console.warn("Failed to load admin metrics", err);
      setError("Dashboard data could not be loaded. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const metrics = data?.metrics;
  const cards = [
    {
      label: "Total orders",
      value: metrics ? formatCount(metrics.totalOrders) : "—",
      detail: `${formatCount(metrics?.activeOrders)} currently active`,
      icon: Package,
      tone: "yellow",
    },
    {
      label: "Gross revenue",
      value: metrics ? formatRupees(metrics.grossRevenueRupees) : "—",
      detail: `${formatRupees(metrics?.platformCommissionRupees)} platform commission`,
      icon: ArrowUpRight,
      tone: "green",
    },
    {
      label: "Delivery partners",
      value: metrics ? formatCount(metrics.totalPartners) : "—",
      detail: `${formatCount(metrics?.onlinePartners)} online · ${formatCount(metrics?.pendingKycPartners)} KYC pending`,
      icon: Users,
      tone: "blue",
      href: "/admin/partners",
    },
    {
      label: "Active deliveries",
      value: metrics ? formatCount(metrics.activeOrders) : "—",
      detail: `${formatCount(metrics?.deliveredOrders)} delivered to date`,
      icon: MapPin,
      tone: "red",
      href: "/admin/tracking",
    },
  ];

  return (
    <div className="app admin-dashboard">
      <header className="page-header admin-dashboard__header">
        <div>
          <span className="admin-dashboard__eyebrow">OPERATIONS</span>
          <h1>Admin dashboard</h1>
          <p>Monitor deliveries, partners and revenue.</p>
        </div>
        <span className="admin-dashboard__role">{user?.role || "ADMIN"}</span>
      </header>

      <main className="admin-dashboard__main">
        {error && (
          <div className="admin-dashboard__error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadMetrics} disabled={loading}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        <section className="admin-dashboard__metrics" aria-label="Key metrics" aria-busy={loading}>
          {cards.map(({ label, value, detail, icon: Icon, tone, href }) => {
            const content = (
              <>
                <div className={`admin-dashboard__metric-icon is-${tone}`}><Icon size={19} /></div>
                <span className="admin-dashboard__metric-label">{label}</span>
                <strong className="admin-dashboard__metric-value">
                  {loading && !metrics ? <Loader2 className="admin-dashboard__spinner" size={24} /> : value}
                </strong>
                <span className="admin-dashboard__metric-detail">{detail}</span>
              </>
            );

            return href ? (
              <button
                className="admin-dashboard__metric admin-dashboard__metric--link"
                key={label}
                type="button"
                onClick={() => navigate(href)}
              >
                {content}
              </button>
            ) : (
              <article className="admin-dashboard__metric" key={label}>{content}</article>
            );
          })}
        </section>

        <div className="admin-dashboard__content">
          <section className="admin-dashboard__panel admin-dashboard__modules">
            <div className="admin-dashboard__section-heading">
              <div>
                <span className="admin-dashboard__eyebrow">WORKSPACE</span>
                <h2>Management</h2>
              </div>
            </div>
            <nav className="admin-dashboard__module-list" aria-label="Management pages">
              {modules.map(({ title, description, icon: Icon, href, tone }) => (
                <button
                  className="admin-dashboard__module"
                  key={href}
                  type="button"
                  onClick={() => navigate(href)}
                >
                  <span className={`admin-dashboard__module-icon is-${tone}`}><Icon size={19} /></span>
                  <span className="admin-dashboard__module-copy">
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <ArrowUpRight className="admin-dashboard__module-arrow" size={17} />
                </button>
              ))}
            </nav>
          </section>

          <section className="admin-dashboard__panel admin-dashboard__activity">
            <div className="admin-dashboard__section-heading">
              <div>
                <span className="admin-dashboard__eyebrow">LATEST UPDATES</span>
                <h2>Recent orders</h2>
              </div>
              <button className="admin-dashboard__text-link" type="button" onClick={() => navigate("/admin/orders")}>
                View all <ArrowUpRight size={15} />
              </button>
            </div>

            {loading ? (
              <div className="admin-dashboard__state"><Loader2 className="admin-dashboard__spinner" size={22} /> Loading orders…</div>
            ) : data?.recentOrders?.length ? (
              <div className="admin-dashboard__order-list">
                {data.recentOrders.map((order) => (
                  <article className="admin-dashboard__order" key={order.id}>
                    <span className="admin-dashboard__order-icon"><Package size={17} /></span>
                    <span className="admin-dashboard__order-copy">
                      <strong>{order.trackingNumber || "Order"}</strong>
                      <small>{order.customer?.name || "Customer"} · {formatRupees((order.fareTotalPaise || 0) / 100)}</small>
                    </span>
                    <span className={`admin-dashboard__status is-${String(order.status || "unknown").toLowerCase()}`}>
                      {(order.status || "Unknown").replaceAll("_", " ")}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-dashboard__state">{error ? "Recent orders are unavailable." : "No orders to show yet."}</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
