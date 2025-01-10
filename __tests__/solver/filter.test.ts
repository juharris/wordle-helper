import fs from 'fs'
import { ValidWords, WordleFilter, WordleFilterResponse, WordleState } from '../../app/solver/filter'

describe("WordleFilter", () => {
    const validWords: ValidWords = JSON.parse(fs.readFileSync('__tests__/test_data/valid_words.json', { encoding: 'utf-8' }))
    const wordleFilter = new WordleFilter()

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
                    score: 63.8,
                    s: []
                },
                {
                    w: "AUDIO",
                    score: 63.8,
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
                    score: 54.5,
                    s: [],
                },
                {
                    w: "FREED",
                    score: 52.4,
                    s: [],
                },
                {
                    w: "FRESH",
                    score: 51.4,
                    s: [],
                },
                {
                    w: "FRUIT",
                    score: 48.9,
                    s: [],
                },
                {
                    w: "FIRST",
                    score: 45.5,
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