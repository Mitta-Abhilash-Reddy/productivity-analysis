import React, { useState, useEffect, useCallback } from "react";
import SummaryCards from "../components/SummaryCards";
import AppUsageChart from "../components/AppUsageChart";
import ActivityTimeline from "../components/ActivityTimeline";
import ImageGrid from "../components/ImageGrid";
import {
  fetchSummary, fetchAppUsage,
  fetchActivityTimeline, fetchScreenshots, fetchCamera,
} from "../services/api";

// ── Productivity ring ─────────────────────────────────────────────────────────
function ProductivityRing({ score }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Excellent" : score >= 40 ? "Moderate" : "Low";

  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "12px",
    }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", alignSelf: "flex-start" }}>
        Productivity Score
      </div>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{ marginTop: "-100px", textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: "36px", fontWeight: 800, color: color, letterSpacing: "-0.03em" }}>
          {score}
        </div>
        <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>out of 100</div>
      </div>
      <div style={{ marginTop: "60px" }}>
        <span style={{
          fontSize: "12px", fontWeight: 700, padding: "4px 14px",
          borderRadius: "20px",
          background: score >= 70 ? "#d1fae5" : score >= 40 ? "#fef3c7" : "#fee2e2",
          color,
        }}>{label}</span>
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ h = 120, r = 14 }) {
  return (
    <div style={{
      height: h, borderRadius: r,
      background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser]               = useState("abhi");
  const [inputUser, setInputUser]     = useState("abhi");
  const [summary, setSummary]         = useState(null);
  const [appUsage, setAppUsage]       = useState([]);
  const [timeline, setTimeline]       = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [camera, setCamera]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadAll = useCallback(async (u) => {
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const [s, a, t, sc, cam] = await Promise.all([
        fetchSummary(u),
        fetchAppUsage(u),
        fetchActivityTimeline(u),
        fetchScreenshots(u),
        fetchCamera(u),
      ]);
      setSummary(s.data);
      setAppUsage(a.data);
      setTimeline(t.data);
      setScreenshots(sc.data);
      setCamera(cam.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(user); }, [user, loadAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => loadAll(user), 30000);
    return () => clearInterval(id);
  }, [user, loadAll]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputUser.trim()) setUser(inputUser.trim());
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; font-family: 'DM Sans', 'Segoe UI', sans-serif; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

        {/* ── Top nav ── */}
        <nav style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "0 32px", height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: "14px",
            }}>W</div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
              WorkTracker
            </span>
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "2px 8px",
              borderRadius: "20px", background: "#ede9fe", color: "#7c3aed",
            }}>Dashboard</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {lastRefresh && (
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
              <input
                value={inputUser}
                onChange={e => setInputUser(e.target.value)}
                placeholder="Employee ID"
                style={{
                  padding: "7px 12px", borderRadius: "8px", fontSize: "13px",
                  border: "1.5px solid #e2e8f0", outline: "none",
                  color: "#0f172a", background: "#f8fafc", width: "140px",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <button type="submit" style={{
                padding: "7px 16px", borderRadius: "8px", fontSize: "13px",
                fontWeight: 600, border: "none", cursor: "pointer",
                background: "#6366f1", color: "#fff",
                transition: "background 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#4f46e5"}
                onMouseLeave={e => e.currentTarget.style.background = "#6366f1"}
              >Load</button>
            </form>
            <button
              onClick={() => loadAll(user)}
              disabled={loading}
              style={{
                padding: "7px 14px", borderRadius: "8px", fontSize: "13px",
                fontWeight: 600, border: "1.5px solid #e2e8f0",
                cursor: loading ? "not-allowed" : "pointer",
                background: "#fff", color: "#475569",
                opacity: loading ? 0.5 : 1,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >↻ Refresh</button>
          </div>
        </nav>

        {/* ── Main content ── */}
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                {user}
              </h1>
              {summary?.lastSeen && (
                <span style={{
                  fontSize: "11px", fontWeight: 600, padding: "3px 10px",
                  borderRadius: "20px",
                  background: Date.now() - new Date(summary.lastSeen).getTime() < 120000
                    ? "#d1fae5" : "#f1f5f9",
                  color: Date.now() - new Date(summary.lastSeen).getTime() < 120000
                    ? "#059669" : "#94a3b8",
                }}>
                  {Date.now() - new Date(summary.lastSeen).getTime() < 120000 ? "● Online" : "○ Offline"}
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
              Productivity monitoring dashboard
            </p>
          </div>

          {error && (
            <div style={{
              background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "10px",
              padding: "12px 16px", marginBottom: "20px",
              color: "#dc2626", fontSize: "13px", fontWeight: 500,
            }}>
              ⚠ {error}
            </div>
          )}

          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Summary cards */}
            {loading && !summary
              ? <Skeleton h={100} />
              : <SummaryCards data={summary} />
            }

            {/* Score ring + App usage */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
              {loading && !summary
                ? <><Skeleton h={280} /><Skeleton h={280} /></>
                : <>
                  <ProductivityRing score={summary?.productivityScore ?? 0} />
                  <AppUsageChart data={appUsage} />
                </>
              }
            </div>

            {/* Activity timeline */}
            {loading && timeline.length === 0
              ? <Skeleton h={300} />
              : <ActivityTimeline data={timeline} />
            }

            {/* Screenshots + Camera side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {loading && screenshots.length === 0
                ? <><Skeleton h={240} /><Skeleton h={240} /></>
                : <>
                  <ImageGrid
                    title="Screenshots"
                    subtitle="Latest 20 screen captures"
                    data={screenshots}
                  />
                  <ImageGrid
                    title="Camera Captures"
                    subtitle="Latest 20 webcam frames"
                    data={camera}
                  />
                </>
              }
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
