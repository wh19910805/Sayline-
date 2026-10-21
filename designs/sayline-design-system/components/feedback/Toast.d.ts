import type { ReactNode } from "react";

/**
 * Short, non-blocking feedback for save, favorite, playback, and network state.
 * @startingPoint section="Feedback" subtitle="Short status message with optional action" viewport="700x240"
 */
export interface ToastProps {
  message: string;
  tone?: "neutral" | "success" | "danger";
  action?: ReactNode;
  onClose?: () => void;
}

export function Toast(props: ToastProps): React.ReactElement;
