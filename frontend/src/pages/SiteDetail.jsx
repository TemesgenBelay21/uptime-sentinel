import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSite, getSiteUptime } from "../api";

export default function SiteDetail() {
  const { id } = useParams();

  const [site, setSite] = useState(null);
  const [uptime, setUptime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getSite(id), getSiteUptime(id, "24h")])
      .then(([siteRes, uptimeRes]) => {
        if (cancelled) return;
        setSite(siteRes.data.site);
        setUptime(uptimeRes.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

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

  return (
    <div className="site-detail">
      <div className="detail-header">
        <Link to="/dashboard" className="back-link">
          ← Dashboard
        </Link>
        <div className="detail-title-row">
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
        </div>
      </div>

      {uptime && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{uptime.uptimePct ?? "—"}%</div>
            <div className="stat-label">Uptime (24h)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uptime.avgResponseMs ?? "—"} ms</div>
            <div className="stat-label">Avg response (24h)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uptime.total}</div>
            <div className="stat-label">Total checks (24h)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-down">{uptime.downtimeCount}</div>
            <div className="stat-label">Failed checks (24h)</div>
          </div>
        </div>
      )}
    </div>
  );
}
