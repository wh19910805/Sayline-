export type LetterState = 'correct' | 'wrong' | 'empty'

export function normalizeDictationWord(word: string) {
  return word
    .normalize('NFKC')
    .replace(/[’‘`´]/g, "'")
    .replace(/[^a-zA-Z0-9']/g, '')
    .toLowerCase()
}

export function getLetterStates(input: string, target: string): LetterState[] {
  const normalizedInput = normalizeDictationWord(input)
  return Array.from(normalizeDictationWord(target)).map((letter, index) => {
    const typed = normalizedInput[index]
    if (!typed) return 'empty'
    return typed === letter ? 'correct' : 'wrong'
  })
}

export function dictationWords(sentence: string) {
  return sentence.split(/\s+/).filter(Boolean)
}
