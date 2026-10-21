/**
 * Sentence, mode, or course progress with accessible numeric semantics.
 * @startingPoint section="Learning" subtitle="Progress indicator for course and sentence completion" viewport="700x220"
 */
export interface ProgressBarProps {
  value?: number;
  label?: string;
  showValue?: boolean;
  tone?: "action" | "moss" | "light";
  className?: string;
}

export function ProgressBar(props: ProgressBarProps): React.ReactElement;
