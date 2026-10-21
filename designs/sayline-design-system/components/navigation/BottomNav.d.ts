/**
 * Persistent two-destination navigation for the learner app.
 * @startingPoint section="Navigation" subtitle="Learner app bottom navigation" viewport="700x240"
 */
export interface BottomNavProps {
  value?: "home" | "me";
  onChange?: (value: "home" | "me") => void;
}

export function BottomNav(props: BottomNavProps): React.ReactElement;
