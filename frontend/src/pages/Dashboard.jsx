import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSites, createSite, deleteSite, updateSite } from "../api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import SiteCard from "../components/SiteCard";
import AddSiteModal from "../components/AddSiteModal";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { subscribe, on } = useSocket();
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const subscribedSiteIds = sites.map((site) => site._id).join(",");

  useEffect(() => {
    let cancelled = false;

    getSites()
      .then((res) => {
        if (!cancelled) setSites(res.data.sites);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load sites");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to real-time updates for all sites
  useEffect(() => {
    if (!subscribedSiteIds) return;
    subscribe(subscribedSiteIds.split(","));

    const cleanup = on(
      "site:status-update",
      ({ siteId, status, responseTimeMs, timestamp }) => {
        setSites((prev) =>
          prev.map((s) =>
            s._id === siteId
              ? {
                  ...s,
                  currentStatus: status,
                  lastCheckedAt: timestamp,
                  responseTimeMs,
                }
              : s,
          ),
        );
      },
    );

    return cleanup;
  }, [subscribedSiteIds, subscribe, on]);

  const handleAdd = async (formData) => {
    const res = await createSite(formData);
    setSites((prev) => [res.data.site, ...prev]);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this site and all its history?")) return;
    await deleteSite(id);
    setSites((prev) => prev.filter((s) => s._id !== id));
  };

  const handleTogglePause = async (site) => {
    const res = await updateSite(site._id, { isActive: !site.isActive });
    setSites((prev) =>
      prev.map((s) => (s._id === site._id ? res.data.site : s)),
    );
  };

  const upCount = sites.filter((s) => s.currentStatus === "up").length;
  const downCount = sites.filter((s) => s.currentStatus === "down").length;

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-name">Uptime Sentinel</span>
        </div>
        <div className="navbar-right">
          <span className="nav-user">Hello, {user?.name?.split(" ")[0]}</span>
          <button
            className="btn-ghost"
            onClick={() => {
              logout();
              navigate("/login");
            }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Header stats */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Your Monitors</h1>
            <p className="dash-sub">
              {sites.length} site{sites.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <button
            id="add-site-btn"
            className="btn-primary"
            onClick={() => setShowModal(true)}>
            + Add site
          </button>
        </div>

        {/* Summary pills */}
        {sites.length > 0 && (
          <div className="summary-pills">
            <div className="pill pill-up">
              <span className="pill-dot" />
              {upCount} Up
            </div>
            <div className="pill pill-down">
              <span className="pill-dot" />
              {downCount} Down
            </div>
            <div className="pill pill-unknown">
              <span className="pill-dot" />
              {sites.length - upCount - downCount} Unknown
            </div>
          </div>
        )}

        {/* Site grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading monitors…</p>
          </div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : sites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <h2>No monitors yet</h2>
            <p>Add your first website to start tracking uptime</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + Add your first site
            </button>
          </div>
        ) : (
          <div className="sites-grid">
            {sites.map((site) => (
              <SiteCard
                key={site._id}
                site={site}
                onDelete={handleDelete}
                onTogglePause={handleTogglePause}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddSiteModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
