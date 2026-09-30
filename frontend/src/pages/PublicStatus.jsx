import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicStatus } from "../api";
import StatusTimeline from "../components/StatusTimeline";

export default function PublicStatus() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicStatus(slug)
      .then((res) => setData(res.data))
      .catch(() => setError("Status page not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <div className="public-loading">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  if (error)
    return (
      <div className="public-loading">
        <p className="public-error">{error}</p>
      </div>
    );

  const { site, recentChecks, uptime } = data;
  const isUp = site.currentStatus === "up";

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-brand">🛡️ Uptime Sentinel</div>
        <h1 className="public-site-name">{site.name}</h1>
        <a
          className="public-url"
          href={site.url}
          target="_blank"
          rel="noreferrer">
          {site.url}
        </a>
      </header>

      {/* Big status indicator */}
      <div
        className={`public-status-badge ${isUp ? "badge-up" : site.currentStatus === "down" ? "badge-down" : "badge-unknown"}`}>
        <span className="badge-dot" />
        <span className="badge-text">
          {isUp
            ? "All Systems Operational"
            : site.currentStatus === "down"
              ? "Service Disruption"
              : "Status Unknown"}
        </span>
      </div>

      {/* Uptime stats */}
      <div className="public-stats">
        <div className="pub-stat">
          <div className="pub-stat-value">{uptime["24h"] ?? "—"}%</div>
          <div className="pub-stat-label">Uptime (24h)</div>
        </div>
        <div className="pub-stat">
          <div className="pub-stat-value">{uptime["7d"] ?? "—"}%</div>
          <div className="pub-stat-label">Uptime (7d)</div>
        </div>
        <div className="pub-stat">
          <div className="pub-stat-value">{uptime["30d"] ?? "—"}%</div>
          <div className="pub-stat-label">Uptime (30d)</div>
        </div>
        {site.lastCheckedAt && (
          <div className="pub-stat">
            <div className="pub-stat-value">
              {new Date(site.lastCheckedAt).toLocaleTimeString()}
            </div>
            <div className="pub-stat-label">Last checked</div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="public-section">
        <h2>Response history</h2>
        <StatusTimeline checks={recentChecks} />
      </div>

      <footer className="public-footer">
        Powered by <strong>Uptime Sentinel</strong>
      </footer>
    </div>
  );
}
