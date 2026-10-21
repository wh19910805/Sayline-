import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Checkbox with a full 44px label target.
 * @startingPoint section="Core" subtitle="Accessible checkbox control" viewport="700x220"
 */
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  children: ReactNode;
}

export function Checkbox(props: CheckboxProps): React.ReactElement;
