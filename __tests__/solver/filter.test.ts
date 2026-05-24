import fs from 'fs'
import { ValidWords, WordleFilter, WordleFilterResponse, WordleState } from '../../app/solver/filter'
import allValidWords from '__tests__/test_data/valid_words.json'

describe("WordleFilter", () => {
    const wordleFilter = new WordleFilter()
    let validWords: ValidWords

    beforeEach(() => {
        // Deep copy to prevent mutation during tests
        validWords = JSON.parse(JSON.stringify(allValidWords))
    })

    test("empty", () => {
        const state: WordleState = {
            known: [],
            banned: [],
            hints: [],
        }
        const response = wordleFilter.filter(state, validWords)
        expect(response.candidates.length).toBe(validWords.words.length)
        expect(Object.is(response.candidates, validWords.words)).toBe(true)
    })


    test("empty", () => {
        const state: WordleState = {
            banned: [],
            hints: ["", "", "", "", ""],
            known: ["", "", "", "", ""],
        }
        const response = wordleFilter.filter(state, validWords, true)
        expect(response.candidates.length).toBe(validWords.words.length)
        expect(Object.is(response.candidates, validWords.words)).toBe(false)
    })

    test("exact - 1 solution", () => {
        const state: WordleState = {
            banned: [],
            hints: ["", "", "", "", ""],
            known: ["F", "R", "U", "I", "T"],
        }
        const response = wordleFilter.filter(state, validWords, true)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "FRUIT",
                    score: 100,
                    s: []
                }
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("exact - 1 solution - duplicate letters", () => {
        const state: WordleState = {
            banned: [],
            hints: ["", "", "", "", ""],
            known: ["C", "O", "R", "E", "R"],
        }
        const response = wordleFilter.filter(state, validWords, true)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "CORER",
                    score: 100,
                    s: []
                }
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })


    test("simple", () => {
        const state: WordleState = {
            known: ["A", "", "", "", ""],
            banned: [],
            hints: [
                "",
                "",
                "",
                "",
                "D"
            ],
        }
        const response = wordleFilter.filter(state, validWords)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "ADIEU",
                    s: []
                },
                {
                    w: "AUDIO",
                    s: []
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("simple - ranking", () => {
        const state: WordleState = {
            known: ["A", "", "", "", ""],
            banned: [],
            hints: [
                "",
                "",
                "",
                "",
                "D"
            ],
        }
        const response = wordleFilter.filter(state, validWords, true)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "ADIEU",
                    score: 56.2,
                    s: []
                },
                {
                    w: "AUDIO",
                    score: 56.2,
                    s: []
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("with banned", () => {
        const state: WordleState = {
            known: ["A", "", "", "", ""],
            banned: ["O"],
            hints: [
                "",
                "",
                "",
                "",
                "D"
            ],
        }
        const response = wordleFilter.filter(state, validWords)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "ADIEU",
                    s: []
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })


    test("Multiple candidates", () => {
        const state: WordleState = {
            known: ["F", "", "", "", ""],
            banned: ["O"],
            hints: [
                "",
                "",
                "",
                "R",
                ""
            ],
        }
        const response = wordleFilter.filter(state, validWords)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "FIRST",
                    s: [],
                },
                {
                    w: "FREED",
                    s: [],
                },
                {
                    w: "FRESH",
                    s: [],
                },
                {
                    w: "FRIED",
                    s: [],
                },
                {
                    w: "FRUIT",
                    s: [],
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })


    test("Multiple candidates - ranking", () => {
        const state: WordleState = {
            known: ["F", "", "", "", ""],
            banned: ["O"],
            hints: [
                "",
                "",
                "",
                "R",
                ""
            ],
        }
        const response = wordleFilter.filter(state, validWords, true)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "FRIED",
                    score: 46.8,
                    s: [],
                },
                {
                    w: "FREED",
                    score: 44.7,
                    s: [],
                },
                {
                    w: "FRESH",
                    score: 43.8,
                    s: [],
                },
                {
                    w: "FRUIT",
                    score: 41.3,
                    s: [],
                },
                {
                    w: "FIRST",
                    score: 37.9,
                    s: [],
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("Multiple hints in same position", () => {
        const state: WordleState = {
            known: ["S", "", "", "", ""],
            banned: ["ADEU"],
            hints: [
                "",
                "",
                "IS",
                "",
                ""
            ],
        }
        const response = wordleFilter.filter(state, validWords)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "STOIC",
                    s: [],
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("Multiple known with duplicates letter", () => {
        const state: WordleState = {
            known: ["F", "R", "E", "", ""],
            banned: [],
            hints: [
                "",
                "",
                "",
                "",
                ""
            ],
        }
        const enableRanking = true
        const response = wordleFilter.filter(state, validWords, enableRanking)
        // They should have the same score because they have distinct remaining letters and the same number of them.
        const expectScore = 57.1
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "FREED",
                    score: expectScore,
                    s: [],
                },
                {
                    w: "FRESH",
                    score: expectScore,
                    s: [],
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("Multiple hints in same position - ranking", () => {
        const state: WordleState = {
            known: ["S", "", "", "", ""],
            banned: ["ADEU"],
            hints: [
                "",
                "",
                "IS",
                "",
                ""
            ],
        }
        const response = wordleFilter.filter(state, validWords, true)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "STOIC",
                    score: 84.7,
                    s: [],
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })

    test("Hint Z", () => {
        const state: WordleState = {
            known: ["F", "", "", "", ""],
            banned: ["O"],
            hints: [
                "",
                "",
                "",
                "",
                "Z"
            ],
        }
        const response = wordleFilter.filter(state, validWords)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "FUZZY",
                    s: []
                },
            ]
        }
        expect(response).toStrictEqual(expectedResponse)
    })
})