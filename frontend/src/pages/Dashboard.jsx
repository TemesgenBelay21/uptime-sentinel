import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSites } from "../api";
import { useAuth } from "../context/AuthContext";
import SiteCard from "../components/SiteCard";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const upCount = sites.filter((s) => s.currentStatus === "up").length;
  const downCount = sites.filter((s) => s.currentStatus === "down").length;

  return (
    <div className="dashboard">
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
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Your Monitors</h1>
            <p className="dash-sub">
              {sites.length} site{sites.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
        </div>

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
          </div>
        ) : (
          <div className="sites-grid">
            {sites.map((site) => (
              <SiteCard key={site._id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
