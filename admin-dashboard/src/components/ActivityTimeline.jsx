import React from "react";

function fmtMs(ms) {
  if (!ms || ms <= 0) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ActivityTimeline({ data }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          Activity Timeline
        </h2>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>
          Last 50 recorded events
        </p>
      </div>

      <div style={{ overflowY: "auto", maxHeight: "420px" }}>
        {(!data || data.length === 0) ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: "13px" }}>
            No activity data yet
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {["Time", "App", "Title", "Duration", "Status"].map(h => (
                  <th key={h} style={{
                    padding: "8px 12px", textAlign: "left",
                    fontSize: "11px", fontWeight: 600,
                    color: "#94a3b8", letterSpacing: "0.05em",
                    textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{
                  borderBottom: "1px solid #f8fafc",
                  background: row.idle ? "#fffbeb" : "transparent",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = row.idle ? "#fef3c7" : "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = row.idle ? "#fffbeb" : "transparent"}
                >
                  <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {fmtTime(row.time)}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                    {row.app || "—"}
                  </td>
                  <td style={{
                    padding: "10px 12px", color: "#475569",
                    maxWidth: "260px", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }} title={row.title}>
                    {row.title || "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {fmtMs(row.duration)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {row.idle ? (
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                        borderRadius: "20px", background: "#fef3c7", color: "#d97706",
                      }}>Idle</span>
                    ) : (
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                        borderRadius: "20px", background: "#d1fae5", color: "#059669",
                      }}>Active</span>
                    )}
                    {row.app_switched && (
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                        borderRadius: "20px", background: "#ede9fe", color: "#7c3aed",
                        marginLeft: "6px",
                      }}>Switched</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
