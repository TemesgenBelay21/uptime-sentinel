/**
 * Renders a row of colored blocks — one per check — green=up, red=down.
 * Hovering shows a tooltip with timestamp and response time.
 */
export default function StatusTimeline({ checks }) {
  if (!checks || checks.length === 0) {
    return <p className="timeline-empty">No check data available yet.</p>;
  }

  // Show most-recent on the right → sort ascending
  const sorted = [...checks].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );

  return (
    <div className="timeline-wrap">
      <div className="timeline-track">
        {sorted.map((c) => (
          <div
            key={c._id}
            className={`timeline-block ${c.isUp ? "block-up" : "block-down"}`}
            title={`${new Date(c.timestamp).toLocaleString()}\n${c.isUp ? "✅ Up" : "🔴 Down"}${c.responseTimeMs ? ` · ${c.responseTimeMs}ms` : ""}${c.errorMessage ? ` · ${c.errorMessage}` : ""}`}
          />
        ))}
      </div>
      <div className="timeline-labels">
        <span>Oldest</span>
        <span>Newest</span>
      </div>
    </div>
  );
}
