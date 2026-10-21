import React from "react";

export function ProgressBar({
  value = 0,
  label,
  showValue = false,
  tone = "action",
  className = "",
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const classes = [
    "sl-progress",
    tone !== "action" ? `sl-progress--${tone}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-label={label || "学习进度"}
      aria-valuemax="100"
      aria-valuemin="0"
      aria-valuenow={Math.round(safeValue)}
      className={classes}
      role="progressbar"
    >
      {(label || showValue) && (
        <div className="sl-progress__labels">
          <span>{label}</span>
          {showValue && <span>{Math.round(safeValue)}%</span>}
        </div>
      )}
      <div className="sl-progress__track">
        <div className="sl-progress__value" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
