import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getSite, getSiteChecks, getSiteUptime, updateSite } from "../api";
import { useSocket } from "../context/SocketContext";
import StatusTimeline from "../components/StatusTimeline";
import ResponseTimeChart from "../components/ResponseTimeChart";

const RANGES = ["24h", "7d", "30d"];

export default function SiteDetail() {
  const { id } = useParams();
  const { subscribe, on } = useSocket();

  const [site, setSite] = useState(null);
  const [recentChecks, setRecentChecks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [range, setRange] = useState("24h");
  const [checks, setChecks] = useState([]);
  const [uptime, setUptime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInterval, setEditInterval] = useState(5);
  const [editMode, setEditMode] = useState(false);
  const siteId = site?._id;

  const fetchAll = useCallback(async () => {
    try {
      const [siteRes, checksRes, uptimeRes] = await Promise.all([
        getSite(id),
        getSiteChecks(id, range),
        getSiteUptime(id, range),
      ]);
      setSite(siteRes.data.site);
      setRecentChecks(siteRes.data.recentChecks);
      setAlerts(siteRes.data.alerts);
      setChecks(checksRes.data.checks);
      setUptime(uptimeRes.data);
      setEditName(siteRes.data.site.name);
      setEditInterval(siteRes.data.site.checkIntervalMinutes);
    } finally {
      setLoading(false);
    }
  }, [id, range]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live updates for this single site
  useEffect(() => {
    if (!siteId) return;
    subscribe([siteId]);
    const cleanup = on(
      "site:status-update",
      ({ siteId: updatedSiteId, status, responseTimeMs, timestamp }) => {
        if (updatedSiteId !== siteId) return;
        setSite((s) => ({
          ...s,
          currentStatus: status,
          lastCheckedAt: timestamp,
          responseTimeMs,
        }));
      },
    );
    return cleanup;
  }, [siteId, subscribe, on]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSite(id, {
        name: editName,
        checkIntervalMinutes: editInterval,
      });
      setSite(res.data.site);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    const res = await updateSite(id, { isActive: !site.isActive });
    setSite(res.data.site);
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <p>Loading monitor data…</p>
      </div>
    );
  }

  if (!site)
    return (
      <div className="detail-loading">
        <p>Site not found.</p>
      </div>
    );

  const statusColor =
    site.currentStatus === "up"
      ? "status-up"
      : site.currentStatus === "down"
        ? "status-down"
        : "status-unknown";

  return (
    <div className="site-detail">
      {/* Header */}
      <div className="detail-header">
        <Link to="/dashboard" className="back-link">
          ← Dashboard
        </Link>
        <div className="detail-title-row">
          {editMode ? (
            <div className="edit-row">
              <input
                className="edit-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <select
                className="edit-select"
                value={editInterval}
                onChange={(e) => setEditInterval(Number(e.target.value))}>
                {[1, 2, 5, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
              <button
                className="btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                className="btn-ghost btn-sm"
                onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="detail-site-name">{site.name}</h1>
                <a
                  className="detail-url"
                  href={site.url}
                  target="_blank"
                  rel="noreferrer">
                  {site.url}
                </a>
              </div>
              <div className="detail-actions">
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setEditMode(true)}>
                  Edit
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={handleTogglePause}>
                  {site.isActive ? "Pause" : "Resume"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${statusColor}`}>
        <span className="status-pulse" />
        <span className="status-label">
          {site.currentStatus === "up"
            ? "✅ Operational"
            : site.currentStatus === "down"
              ? "🔴 Down"
              : "⬜ Unknown"}
        </span>
        {site.lastCheckedAt && (
          <span className="status-time">
            Last checked {timeAgo(site.lastCheckedAt)}
          </span>
        )}
        {!site.isActive && <span className="paused-badge">Paused</span>}
        <a
          className="public-link"
          href={`/status/${site.publicSlug}`}
          target="_blank"
          rel="noreferrer">
          🔗 Public status page
        </a>
      </div>

      {/* Uptime stats */}
      {uptime && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{uptime.uptimePct ?? "—"}%</div>
            <div className="stat-label">Uptime ({range})</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uptime.avgResponseMs ?? "—"} ms</div>
            <div className="stat-label">Avg response ({range})</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uptime.total}</div>
            <div className="stat-label">Total checks ({range})</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-down">{uptime.downtimeCount}</div>
            <div className="stat-label">Failed checks ({range})</div>
          </div>
        </div>
      )}

      {/* Range selector */}
      <div className="range-tabs">
        {RANGES.map((r) => (
          <button
            key={r}
            className={`range-tab ${range === r ? "active" : ""}`}
            onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Response Time (ms)</h3>
          <ResponseTimeChart checks={checks} />
        </div>
      </div>

      {/* Timeline */}
      <div className="section-card">
        <h3>Recent Checks Timeline</h3>
        <StatusTimeline checks={recentChecks} />
      </div>

      {/* Alert history */}
      {alerts.length > 0 && (
        <div className="section-card">
          <h3>Alert History</h3>
          <div className="alert-list">
            {alerts.map((a) => (
              <div key={a._id} className={`alert-item alert-${a.type}`}>
                <span className="alert-icon">
                  {a.type === "down" ? "🔴" : "🟢"}
                </span>
                <div className="alert-meta">
                  <span className="alert-type">
                    {a.type === "down" ? "Site went down" : "Site recovered"}
                  </span>
                  <span className="alert-time">
                    {new Date(a.sentAt).toLocaleString()}
                  </span>
                </div>
                <span className="alert-email">{a.emailedTo}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
