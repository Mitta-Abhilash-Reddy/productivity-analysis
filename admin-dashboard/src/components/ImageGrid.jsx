import React, { useState } from "react";

function fmtDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ImageGrid({ title, subtitle, data }) {
  const [modal, setModal] = useState(null);

  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    }}>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h2>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>{subtitle}</p>
      </div>

      {(!data || data.length === 0) ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: "13px" }}>
          No captures yet
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
        }}>
          {data.map((item, i) => (
            <div
              key={i}
              onClick={() => setModal(item)}
              style={{
                borderRadius: "10px", overflow: "hidden",
                cursor: "pointer", position: "relative",
                background: "#f1f5f9",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.14)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
              }}
            >
              <img
                src={item.image_url}
                alt={`capture-${i}`}
                style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }}
                onError={e => { e.target.style.display = "none"; }}
              />
              <div style={{
                padding: "6px 8px", fontSize: "10px",
                color: "#64748b", background: "#fff",
                borderTop: "1px solid #f1f5f9",
              }}>
                {fmtDateTime(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "16px", overflow: "hidden",
              maxWidth: "90vw", maxHeight: "90vh",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}
          >
            <img
              src={modal.image_url}
              alt="preview"
              style={{ maxWidth: "80vw", maxHeight: "75vh", display: "block", objectFit: "contain" }}
            />
            <div style={{
              padding: "12px 16px", fontSize: "12px", color: "#64748b",
              background: "#f8fafc", borderTop: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{fmtDateTime(modal.timestamp)}</span>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "#0f172a", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "6px 14px",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                }}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
