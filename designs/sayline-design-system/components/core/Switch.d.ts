import type { ReactNode } from "react";

/**
 * Binary preference control with a native switch role.
 * @startingPoint section="Core" subtitle="Accessible preference switch" viewport="700x220"
 */
export interface SwitchProps {
  id: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export function Switch(props: SwitchProps): React.ReactElement;
