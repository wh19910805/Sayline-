import React from "react";

export function StatTile({ value, label, detail, className = "" }) {
  return (
    <div className={["sl-stat-tile", className].filter(Boolean).join(" ")}>
      <strong className="sl-stat-tile__value">{value}</strong>
      <span className="sl-stat-tile__label">{label}</span>
      {detail && <span className="sl-stat-tile__detail">{detail}</span>}
    </div>
  );
}
