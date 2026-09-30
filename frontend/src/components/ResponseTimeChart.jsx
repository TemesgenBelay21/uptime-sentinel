import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15,20,40,0.95)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#e2e8f0',
        fontSize: '13px',
      }}
    >
      <p style={{ margin: 0, color: '#94a3b8' }}>{label}</p>
      <p style={{ margin: '4px 0 0', color: '#818cf8', fontWeight: 600 }}>
        {payload[0].value} ms
      </p>
    </div>
  );
};

export default function ResponseTimeChart({ checks }) {
  if (!checks || checks.length === 0) {
    return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No data yet.</p>;
  }

  const data = checks
    .filter((c) => c.responseTimeMs != null)
    .map((c) => ({
      time: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ms: c.responseTimeMs,
    }));

  if (data.length === 0) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No response time data.</p>;

  const avg = Math.round(data.reduce((s, d) => s + d.ms, 0) / data.length);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          unit=" ms"
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={avg}
          stroke="rgba(129,140,248,0.3)"
          strokeDasharray="4 4"
          label={{ value: `avg ${avg}ms`, fill: '#64748b', fontSize: 11, position: 'right' }}
        />
        <Line
          type="monotone"
          dataKey="ms"
          stroke="url(#lineGrad)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: '#818cf8' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
