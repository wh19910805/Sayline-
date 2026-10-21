import type { InputHTMLAttributes } from "react";

/**
 * Labelled text input with hint and field-level validation.
 * @startingPoint section="Core" subtitle="Text field with validation states" viewport="700x320"
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  aside?: string;
}

export function Input(props: InputProps): React.ReactElement;
