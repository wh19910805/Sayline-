import React from "react";
import { Icon } from "../core/Icon.jsx";

const modes = [
  { value: "listen", label: "听", icon: "headphones" },
  { value: "read", label: "读", icon: "book-open" },
  { value: "write", label: "写", icon: "pen-line" },
  { value: "speak", label: "说", icon: "mic" },
];

export function ModeSwitcher({ value = "listen", onChange, iconOnly = false }) {
  return (
    <div
      aria-label="学习模式"
      className={"sl-mode-switch " + (iconOnly ? "sl-mode-switch--icon-only" : "")}
      role="tablist"
    >
      {modes.map((mode) => (
        <button
          aria-label={iconOnly ? mode.label : undefined}
          aria-selected={value === mode.value}
          className="sl-mode"
          key={mode.value}
          onClick={() => onChange?.(mode.value)}
          role="tab"
          type="button"
        >
          <Icon name={mode.icon} size={19} />
          {!iconOnly && <span>{mode.label}</span>}
        </button>
      ))}
    </div>
  );
}
