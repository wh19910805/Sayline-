import type { SVGProps } from "react";

/**
 * Lucide-compatible line icon rendered from Sayline's copied icon set.
 * @startingPoint section="Core" subtitle="Line icon from the Sayline icon set" viewport="700x260"
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name:
    | "arrow-left"
    | "arrow-right"
    | "audio-lines"
    | "book-open"
    | "bookmark"
    | "calendar-days"
    | "captions"
    | "check"
    | "chevron-down"
    | "chevron-left"
    | "chevron-right"
    | "chevrons-down"
    | "chevrons-up"
    | "circle-check"
    | "clock-3"
    | "ellipsis"
    | "headphones"
    | "heart"
    | "home"
    | "image"
    | "lock-keyhole"
    | "log-in"
    | "log-out"
    | "mic"
    | "music-2"
    | "pause"
    | "pen-line"
    | "play"
    | "plus"
    | "rotate-ccw"
    | "rotate-cw"
    | "search"
    | "settings-2"
    | "skip-back"
    | "skip-forward"
    | "sparkles"
    | "square"
    | "trash-2"
    | "upload"
    | "user-round"
    | "volume-2"
    | "x";
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function Icon(props: IconProps): React.ReactElement | null;
