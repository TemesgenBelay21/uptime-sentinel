import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  up: { label: "Up", className: "status-up", icon: "●" },
  down: { label: "Down", className: "status-down", icon: "●" },
  unknown: { label: "Unknown", className: "status-unknown", icon: "●" },
};

function timeAgo(ts) {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SiteCard({ site, onDelete, onTogglePause }) {
  const cfg = STATUS_CONFIG[site.currentStatus] || STATUS_CONFIG.unknown;

  return (
    <div className={`site-card ${cfg.className}`}>
      <div className="card-top">
        <div className="card-status-indicator">
          <span
            className={`status-dot ${cfg.className} ${site.currentStatus === "down" ? "pulse" : ""}`}>
            {cfg.icon}
          </span>
          <span className={`status-text ${cfg.className}`}>{cfg.label}</span>
        </div>
        {!site.isActive && <span className="paused-tag">Paused</span>}
      </div>

      <div className="card-body">
        <Link to={`/sites/${site._id}`} className="card-name">
          {site.name}
        </Link>
        <p className="card-url" title={site.url}>
          {site.url}
        </p>
      </div>

      <div className="card-meta">
        <span className="meta-item">🕐 {timeAgo(site.lastCheckedAt)}</span>
        <span className="meta-item">
          ⏱ {site.checkIntervalMinutes}m interval
        </span>
        {site.responseTimeMs != null && (
          <span className="meta-item">📶 {site.responseTimeMs}ms</span>
        )}
      </div>

      <div className="card-actions">
        <Link to={`/sites/${site._id}`} className="card-btn card-btn-detail">
          View details
        </Link>
        <button
          className="card-btn card-btn-ghost"
          onClick={() => onTogglePause(site)}
          title={site.isActive ? "Pause monitoring" : "Resume monitoring"}>
          {site.isActive ? "⏸" : "▶"}
        </button>
        <button
          className="card-btn card-btn-delete"
          onClick={() => onDelete(site._id)}
          title="Delete site">
          🗑
        </button>
      </div>
    </div>
  );
}
