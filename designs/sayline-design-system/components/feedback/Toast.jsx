import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Toast({ message, tone = "neutral", action, onClose }) {
  const icon = tone === "success" ? "circle-check" : tone === "danger" ? "x" : "sparkles";

  return (
    <div
      aria-live="polite"
      className={["sl-toast", tone !== "neutral" ? `sl-toast--${tone}` : ""].filter(Boolean).join(" ")}
      role="status"
    >
      <Icon name={icon} size={18} />
      <span className="sl-toast__message">{message}</span>
      {action}
      {onClose && (
        <button aria-label="关闭提示" className="sl-toast__action" onClick={onClose} type="button">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
