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
    /**
     * A score to use for ranking candidates.
     * Higher scores are better.
     * Range: `[0, 1]`.
     */
    score?: number
}

export interface WordleFilterResponse {
    candidates: WordleSolutionCandidate[]
}

export interface ValidWords {
    words: WordleSolutionCandidate[]
}

export class WordleFilter {
    private static assignScores = (candidates: WordleSolutionCandidate[], state: WordleState): void => {
        // TODO Use the position of the letter in the word to give more weight to the score.
        // FIXME "_L_RM" should give "ALARM" a score of 100.
        const letterFrequencies = new Map<string, number>()
        for (const candidate of candidates) {
            const { w: word } = candidate
            // Only consider each letter once per word because we only need to know if it's present as we're trying to maximize the number of letters in a guess.
            const letters = new Set(word.split(''))
            for (const letter of letters) {
                if (state.hints.some(hint => hint === letter)) {
                    // Skip letters that are in hints because all words will have them.
                    continue
                }
                if (state.known.some((known, index) => known === letter && word[index] !== letter)) {
                    continue
                }
                const count = letterFrequencies.get(letter) || 0
                letterFrequencies.set(letter, count + 1)
            }
        }

        // Normalize the frequencies.
        for (const [letter, frequency] of letterFrequencies) {
            letterFrequencies.set(letter, frequency / candidates.length)
        }

        for (const candidate of candidates) {
            const { w: word } = candidate
            // Only consider each letter once per word because we only need to know if it's present as we're trying to maximize the number of letters in a guess.
            const letters = new Set(word.split(''))
            let score = 0
            for (const letter of letters) {
                if (state.hints.some(hint => hint === letter)) {
                    // Skip letters that are in hints because all words will have them.
                    continue
                }
                if (state.known.some((known, index) => known === letter && word[index] !== letter)) {
                    continue
                }
                score += letterFrequencies.get(letter)!
            }

            candidate.score = Math.round(100 * (score / word.length))
        }
    }

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

    private static isEmptyState = (state: WordleState) => {
        return state.banned.every(b => !b) && state.hints.every(h => !h) && state.known.every(k => !k)
    }

    private static sortCandidates = (candidates: WordleSolutionCandidate[]): void => {
        const locale = 'en'
        // Sort by date, then by score, then by word.
        candidates.sort((c1, c2) => {
            if (c1.d && c2.d) {
                // All dates should be unique, so we don't need to compare them.
                if (c1.score !== undefined && c2.score !== undefined && c1.score !== c2.score) {
                    return c2.score - c1.score
                }
                return c1.w.localeCompare(c2.w, locale)
            } else if (c1.d) {
                return 1
            } else if (c2.d) {
                return -1
            }

            // Neither have dates.
            if (c1.score !== undefined && c2.score !== undefined && c1.score !== c2.score) {
                return c2.score - c1.score
            }

            return c1.w.localeCompare(c2.w, locale)
        })
    }

    public filter(
        state: WordleState,
        possibleSolutions: ValidWords,
        enableRanking = false)
        : WordleFilterResponse {
        let candidates: WordleSolutionCandidate[]
        // Check for the typical empty case when the page first loads and avoid filtering nothing out from the candidates.
        const isEmptyState = WordleFilter.isEmptyState(state)
        if (isEmptyState) {
            if (enableRanking) {
                // Need a copy to avoid re-sorting the original array.
                candidates = [...possibleSolutions.words]
            } else {
                // Use the original and trust the alphabetical order, ignoring dates.
                candidates = possibleSolutions.words
            }
        } else {
            const pattern = WordleFilter.buildPattern(state)
            candidates = WordleFilter.getCandidates(possibleSolutions, state, pattern)
        }

        if (enableRanking) {
            WordleFilter.assignScores(candidates, state)
            WordleFilter.sortCandidates(candidates)
        } else {
            for (const candidate of candidates) {
                delete candidate.score
            }

            if (!isEmptyState) {
                WordleFilter.sortCandidates(candidates)
            }
        }

        return {
            candidates,
        }
    }
}