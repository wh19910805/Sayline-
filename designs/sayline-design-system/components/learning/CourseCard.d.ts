/**
 * Course row that opens the player directly and keeps favorite actions separate.
 * @startingPoint section="Learning" subtitle="Course row with cover and favorite state" viewport="700x320"
 */
export interface CourseCardProps {
  title: string;
  meta: string;
  coverUrl?: string;
  colorA?: string;
  colorB?: string;
  favorite?: boolean;
  progress?: number;
  duration?: string;
  variant?: "row" | "feed";
  onOpen?: () => void;
  onToggleFavorite?: () => void;
  className?: string;
}

export function CourseCard(props: CourseCardProps): React.ReactElement;
