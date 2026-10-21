import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Circular 44px target for icon-only controls.
 * @startingPoint section="Core" subtitle="Icon-only control with touch-safe target" viewport="700x240"
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
  variant?: "plain" | "outline";
  active?: boolean;
}

export function IconButton(props: IconButtonProps): React.ReactElement;
