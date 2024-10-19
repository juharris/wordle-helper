import { ValidWords, WordleFilter, WordleFilterResponse, WordleState } from './filter'
import fs from 'fs'

describe("WordleFilter", () => {
    const validWords: ValidWords = JSON.parse(fs.readFileSync('__tests__/test_data/valid_words.json', { encoding: 'utf-8' }))
    const wordleFilter = new WordleFilter(validWords)

    test("empty", () => {
        const state: WordleState = {
            known: [],
            banned: [],
            hints: [],
        }
        const response = wordleFilter.filter(state)
        expect(response.candidates.length).toBe(validWords.words.length);
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
        const response = wordleFilter.filter(state)
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
        const response = wordleFilter.filter(state)
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
        const response = wordleFilter.filter(state)
        const expectedResponse: WordleFilterResponse = {
            candidates: [
                {
                    w: "FRESH",
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
        const response = wordleFilter.filter(state)
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