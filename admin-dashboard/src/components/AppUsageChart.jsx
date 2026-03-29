import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function fmtMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const COLORS = [
  "#6366f1","#8b5cf6","#06b6d4","#10b981",
  "#f59e0b","#ef4444","#ec4899","#3b82f6",
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a", color: "#f8fafc", borderRadius: "10px",
      padding: "10px 14px", fontSize: "13px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{payload[0].payload.app}</div>
      <div style={{ color: "#94a3b8" }}>{fmtMs(payload[0].value)}</div>
    </div>
  );
};

export default function AppUsageChart({ data }) {
  const sorted = [...(data || [])].sort((a, b) => b.totalTime - a.totalTime).slice(0, 10);

  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          App Usage
        </h2>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>
          Time spent per application (active only)
        </p>
      </div>
      {sorted.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="app"
              tick={{ fontSize: 11, fill: "#64748b" }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tickFormatter={fmtMs}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="totalTime" radius={[6, 6, 0, 0]}>
              {sorted.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: "13px" }}>
      No app usage data yet
    </div>
  );
}
