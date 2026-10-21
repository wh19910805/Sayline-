import React from "react";

export function Badge({ children, tone = "neutral", className = "", ...props }) {
  return (
    <span
      className={[
        "sl-badge",
        tone !== "neutral" ? `sl-badge--${tone}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
