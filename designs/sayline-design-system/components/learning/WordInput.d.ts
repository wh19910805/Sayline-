/**
 * Word-by-word dictation input where each underline scales to the word length.
 * @startingPoint section="Learning" subtitle="Word-length dictation blanks" viewport="700x360"
 */
export interface WordInputProps {
  words: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  label?: string;
  onComplete?: () => void;
  className?: string;
}

export function WordInput(props: WordInputProps): React.ReactElement;
