import React from "react";

function fmtMs(ms) {
  if (!ms || ms <= 0) return "0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

function scoreColor(score) {
  if (score >= 70) return { text: "#10b981", bg: "#d1fae5", label: "Excellent" };
  if (score >= 40) return { text: "#f59e0b", bg: "#fef3c7", label: "Moderate" };
  return { text: "#ef4444", bg: "#fee2e2", label: "Low" };
}

const icons = {
  active:   "▶",
  idle:     "⏸",
  score:    "◎",
  switches: "⇄",
  seen:     "◉",
};

export default function SummaryCards({ data }) {
  const sc = scoreColor(data?.productivityScore ?? 0);
  const online = isOnline(data?.lastSeen);

  const cards = [
    {
      icon: icons.active,
      label: "Active Time",
      value: fmtMs(data?.totalActiveTime),
      accent: "#6366f1",
      bg: "#eef2ff",
    },
    {
      icon: icons.idle,
      label: "Idle Time",
      value: fmtMs(data?.totalIdleTime),
      accent: "#94a3b8",
      bg: "#f1f5f9",
    },
    {
      icon: icons.score,
      label: "Productivity",
      value: `${data?.productivityScore ?? 0}%`,
      badge: sc.label,
      accent: sc.text,
      bg: sc.bg,
    },
    {
      icon: icons.switches,
      label: "App Switches",
      value: data?.appSwitchCount ?? 0,
      accent: "#8b5cf6",
      bg: "#f5f3ff",
    },
    {
      icon: icons.seen,
      label: "Last Seen",
      value: data?.lastSeen
        ? new Date(data.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "—",
      badge: online ? "Online" : "Offline",
      badgeColor: online ? "#10b981" : "#94a3b8",
      badgeBg: online ? "#d1fae5" : "#f1f5f9",
      accent: online ? "#10b981" : "#94a3b8",
      bg: online ? "#ecfdf5" : "#f8fafc",
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px",
    }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "20px 22px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
          borderLeft: `4px solid ${c.accent}`,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          transition: "transform 0.15s, box-shadow 0.15s",
          cursor: "default",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "#94a3b8"
            }}>{c.label}</span>
            <span style={{
              fontSize: "18px", width: "32px", height: "32px",
              borderRadius: "8px", background: c.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: c.accent,
            }}>{c.icon}</span>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {c.value}
          </div>
          {c.badge && (
            <span style={{
              display: "inline-block", fontSize: "11px", fontWeight: 600,
              padding: "2px 8px", borderRadius: "20px",
              background: c.badgeBg || sc.bg,
              color: c.badgeColor || sc.text,
              alignSelf: "flex-start",
            }}>{c.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
}
