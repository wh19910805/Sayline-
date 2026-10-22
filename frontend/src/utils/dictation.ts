export type LetterState = 'correct' | 'wrong' | 'empty'

export function getLetterStates(input: string, target: string): LetterState[] {
  const normalizedInput = input.trim()
  return Array.from(target).map((letter, index) => {
    const typed = normalizedInput[index]
    if (!typed) return 'empty'
    return typed.toLowerCase() === letter.toLowerCase() ? 'correct' : 'wrong'
  })
}

export function dictationWords(sentence: string) {
  return sentence.split(/\s+/).filter(Boolean)
}
