import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Primary action control with product-wide sizing and states.
 * @startingPoint section="Core" subtitle="Action button with product states" viewport="700x300"
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button(props: ButtonProps): React.ReactElement;
