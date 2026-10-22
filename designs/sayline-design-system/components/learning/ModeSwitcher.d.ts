/**
 * Four-mode player dock for listening, reading, writing, and speaking.
 * @startingPoint section="Learning" subtitle="Four-mode learning switch for the immersive player" viewport="700x260"
 */
export interface ModeSwitcherProps {
  value?: "listen" | "read" | "write" | "speak";
  onChange?: (value: "listen" | "read" | "write" | "speak") => void;
  iconOnly?: boolean;
}

export function ModeSwitcher(props: ModeSwitcherProps): React.ReactElement;
