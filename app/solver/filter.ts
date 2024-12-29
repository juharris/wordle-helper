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
                if (state.known.some(known => known === letter)) {
                    // Skip letters that are known because all words will have them and we're trying to maximize the number of letters in a guess.
                    continue
                }
                const count = letterFrequencies.get(letter) || 0
                letterFrequencies.set(letter, count + 1)
            }
        }

        for (const candidate of candidates) {
            const { w: word } = candidate
            // Only consider each letter once per word because we only need to know if it's present as we're trying to maximize the number of letters in a guess.
            const letters = new Set(word.split(''))
            let count = 0
            let score = 0
            for (const letter of letters) {
                if (state.hints.some(hint => hint === letter)) {
                    // Skip letters that are in hints because all words will have them.
                    continue
                }
                if (state.known.some(known => known === letter)) {
                    // Skip letters that are known because all words will have them and we're trying to maximize the number of letters in a guess.
                    continue
                }
                score += (letterFrequencies.get(letter)!) / letterFrequencies.size
                ++count
            }
            if (count === 0) {
                candidate.score = 0
            } else {
                candidate.score = score / count
            }
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
        // Check for the typical empty case when the page first loads and avoid filtering nothing out from the candidates.
        if (WordleFilter.isEmptyState(state)) {
            return {
                candidates: possibleSolutions.words,
            }
        }

        const pattern = WordleFilter.buildPattern(state)
        const candidates = WordleFilter.getCandidates(possibleSolutions, state, pattern)
        if (enableRanking) {
            WordleFilter.assignScores(candidates, state)
        } else {
            for (const candidate of candidates) {
                delete candidate.score
            }
        }
        WordleFilter.sortCandidates(candidates)

        return {
            candidates,
        }
    }
}