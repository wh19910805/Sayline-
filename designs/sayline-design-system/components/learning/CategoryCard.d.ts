/**
 * Square category cover that opens each personalized discovery feed.
 * @startingPoint section="Learning" subtitle="Square category image tile for the waterfall feed" viewport="700x380"
 */
export interface CategoryCardProps {
  title: string;
  description: string;
  courseCount: number;
  coverUrl?: string;
  colorA?: string;
  colorB?: string;
  className?: string;
}

export function CategoryCard(props: CategoryCardProps): React.ReactElement;
