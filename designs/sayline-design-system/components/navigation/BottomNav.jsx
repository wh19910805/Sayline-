import React from "react";
import { Icon } from "../core/Icon.jsx";

const items = [
  { value: "home", label: "首页", icon: "home" },
  { value: "me", label: "我的", icon: "user-round" },
];

export function BottomNav({ value = "home", onChange }) {
  return (
    <nav aria-label="主导航" className="sl-bottom-nav">
      {items.map((item) => (
        <button
          aria-current={value === item.value ? "page" : undefined}
          className="sl-bottom-nav__item"
          key={item.value}
          onClick={() => onChange?.(item.value)}
          type="button"
        >
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
