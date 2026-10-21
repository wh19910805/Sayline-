import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className = "",
  type = "button",
  ...props
}) {
  const classes = [
    "sl-button",
    `sl-button--${variant}`,
    `sl-button--${size}`,
    fullWidth ? "sl-button--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-busy={loading || undefined}
      className={classes}
      disabled={loading || props.disabled}
      type={type}
      {...props}
    >
      {loading ? <span aria-hidden="true">···</span> : children}
    </button>
  );
}
