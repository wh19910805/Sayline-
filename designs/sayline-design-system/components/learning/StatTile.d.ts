/**
 * Compact summary number used in weekly and monthly learning reports.
 * @startingPoint section="Learning" subtitle="Responsive learning metric tile" viewport="700x240"
 */
export interface StatTileProps {
  value: string | number;
  label: string;
  detail?: string;
  className?: string;
}

export function StatTile(props: StatTileProps): React.ReactElement;
