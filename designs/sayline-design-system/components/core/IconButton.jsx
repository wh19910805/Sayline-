import React from "react";

export function IconButton({
  children,
  label,
  variant = "plain",
  active = false,
  className = "",
  ...props
}) {
  const classes = [
    "sl-icon-button",
    variant === "outline" ? "sl-icon-button--outline" : "",
    active ? "sl-icon-button--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={label}
      className={classes}
      title={label}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
