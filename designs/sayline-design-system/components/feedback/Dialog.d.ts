import type { ReactNode } from "react";

/**
 * Focused confirmation or interruption surface with a calm editorial headline.
 * @startingPoint section="Feedback" subtitle="Confirmation dialog with clear actions" viewport="700x480"
 */
export interface DialogProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
}

export function Dialog(props: DialogProps): React.ReactElement | null;
