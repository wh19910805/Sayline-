/**
 * Scroll-safe category navigation for course and statistics views.
 * @startingPoint section="Navigation" subtitle="Category tabs with underline and pill variants" viewport="700x260"
 */
export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  variant?: "underline" | "pill";
  className?: string;
}

export function Tabs(props: TabsProps): React.ReactElement;
