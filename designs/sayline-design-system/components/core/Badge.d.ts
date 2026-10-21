import type { HTMLAttributes, ReactNode } from "react";

/**
 * Compact status or metadata label.
 * @startingPoint section="Core" subtitle="Status and metadata badge tones" viewport="700x240"
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: "neutral" | "action" | "success" | "warning";
}

export function Badge(props: BadgeProps): React.ReactElement;
