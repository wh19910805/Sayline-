import type { TextareaHTMLAttributes } from "react";

/**
 * Multi-line field used for sentence dictation.
 * @startingPoint section="Core" subtitle="Dictation field with guidance and validation" viewport="700x360"
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  aside?: string;
}

export function Textarea(props: TextareaProps): React.ReactElement;
