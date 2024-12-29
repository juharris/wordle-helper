export interface WordleState {
    /**
     * Known letters at their position.
     */
    known: string[]

    /**
     * Letters that are in the word, but not at these positions.
     */
    hints: string[]

    /**
     * Letters that are not in the word.
     */
    banned: string[]
}

export class WordleSource {
    constructor(
        public name: string,
        public url?: string) { }
}

export interface WordleSolutionCandidate {
    /** The word. */
    w: string
    /** The date when the word was used. */
    d?: string
    /** Sources */
    s: string[]
}

export interface WordleFilterResponse {
    candidates: WordleSolutionCandidate[]
}

export interface ValidWords {
    words: WordleSolutionCandidate[]
}

export class WordleFilter {
    private static buildPattern = (state: WordleState): RegExp => {
        const options = [
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        ]

        state.known.forEach((letter, position) => {
            if (letter) {
                options[position] = letter
            }
        })

        for (const bannedLetter of state.banned) {
            for (const i in options) {
                const opt = options[i]
                const letterIndex = opt.indexOf(bannedLetter)
                if (letterIndex >= 0) {
                    options[i] = opt.substring(0, letterIndex) + opt.substring(letterIndex + 1, opt.length)
                }
            }
        }

        state.hints.forEach((letters, position) => {
            let opt = options[position]
            for (const letter of letters) {
                const letterIndex = opt.indexOf(letter)
                if (letterIndex >= 0) {
                    options[position] = opt = opt.substring(0, letterIndex) + opt.substring(letterIndex + 1, opt.length)
                }
            }
        })

        let pattern = '^'
        for (const opt of options) {
            pattern += `[${opt}]`
        }
        pattern += '$'
        return new RegExp(pattern)
    }

    private static getCandidates = (possibleSolutions: ValidWords, state: WordleState, pattern: RegExp) => {
        const result: WordleSolutionCandidate[] = []
        for (const candidate of possibleSolutions.words) {
            const { w: word } = candidate
            let skipWord = false
            for (const hint of state.hints) {
                for (const letter of hint) {
                    if (!word.includes(letter)) {
                        skipWord = true
                        break
                    }
                }
            }

            if (skipWord || !pattern.test(word)) {
                continue
            }

            result.push(candidate)
        }

        return result
    }

    private static sortCandidates = (candidates: WordleSolutionCandidate[]) => {
        const locale = 'en'
        // Sort by date, then by word.
        candidates.sort((c1, c2) => {
            if (c1.d && c2.d) {
                // All dates should be unique, so we don't need to compare them.
                return c1.w.localeCompare(c2.w, locale)
            } else if (c1.d) {
                return 1
            } else if (c2.d) {
                return -1
            }
            return c1.w.localeCompare(c2.w, locale)
        })
    }

    filter(
        state: WordleState,
        possibleSolutions: ValidWords)
        : WordleFilterResponse {
        // Check for the empty case to avoid filtering all words.
        if (state.banned.every(b => !b) && state.hints.every(h => !h) && state.known.every(k => !k)) {
            return {
                candidates: possibleSolutions.words,
            }
        }

        const pattern = WordleFilter.buildPattern(state)
        const candidates = WordleFilter.getCandidates(possibleSolutions, state, pattern)
        WordleFilter.sortCandidates(candidates)

        return {
            candidates,
        }
    }
}