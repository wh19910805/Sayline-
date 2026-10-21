import React from "react";
import { Icon } from "../core/Icon.jsx";

const modes = [
  { value: "listen", label: "听", icon: "headphones" },
  { value: "read", label: "读", icon: "book-open" },
  { value: "write", label: "写", icon: "pen-line" },
  { value: "speak", label: "说", icon: "mic" },
];

export function ModeSwitcher({ value = "listen", onChange }) {
  return (
    <div aria-label="学习模式" className="sl-mode-switch" role="tablist">
      {modes.map((mode) => (
        <button
          aria-selected={value === mode.value}
          className="sl-mode"
          key={mode.value}
          onClick={() => onChange?.(mode.value)}
          role="tab"
          type="button"
        >
          <Icon name={mode.icon} size={19} />
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
