import { ValidWords } from 'app/solver/filter'
import axios from 'axios'
import * as fs from 'fs'
import { NodeType, parse } from 'node-html-parser'
import validWords from '../public/words.json'

const addUsedDates = async () => {
    const usedWords = await getUsedWords()
    for (const word of (validWords as ValidWords).words) {
        if (word.d) {
            usedWords.delete(word.w)
            continue
        }
        const date = usedWords.get(word.w)
        if (date) {
            console.log(`Adding date "${date}" to word "${word.w}".`)
            word.d = date
            usedWords.delete(word.w)
        }
    }

    for (const [word, date] of usedWords.entries()) {
        if (!isValidWord(word)) {
            console.warn(`Ignoring invalid previous solution "${word}".`)
            continue
        }
        console.log(`Adding previous solution "${word}" with date "${date}".`)
        validWords.words.push({ w: word, s: ['fiveforks'], d: date })
    }
}

const getUsedWords = async (): Promise<Map<string, string>> => {
    const baseUrl = 'https://www.fiveforks.com/wordle'
    const result = new Map<string, string>()

    const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'

    const urlsToTry = [baseUrl]

    if (isGitHubActions) {
        urlsToTry.push(
            `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`
        )
    }

    for (let i = 0; i < urlsToTry.length; i++) {
        const url = urlsToTry[i]
        const isProxy = url !== baseUrl

        try {
            console.log(`Fetching '${url}'${isProxy ? ' (via proxy)' : ''}...`)

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': isGitHubActions
                        ? 'Mozilla/5.0 (compatible; WordleBot/1.0)'
                        : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                },
                timeout: 30000,
                maxRedirects: 5,
                decompress: true,
                responseType: 'text'
            })

            // Extract HTML from response (handle proxy formats)
            let html: string
            if (isProxy && response.data.contents) {
                html = response.data.contents  // allorigins format
            } else if (typeof response.data === 'string') {
                html = response.data  // direct or corsproxy format
            } else {
                throw new Error('Unexpected response format')
            }

            // Parse and extract words (shared logic)
            parseWordsFromHtml(html, result)

            console.log(`Successfully fetched ${result.size} words${isProxy ? ' via proxy' : ''}`)
            return result

        } catch (error) {
            console.warn(`Attempt ${i + 1}/${urlsToTry.length} failed:`, error instanceof Error ? error.message : String(error))
            if (i === urlsToTry.length - 1) {
                // Last attempt failed
                throw new Error(`All ${urlsToTry.length} fetch attempts failed`)
            }
        }
    }

    return result
}

const parseWordsFromHtml = (html: string, result: Map<string, string>) => {
    const root = parse(html)
    const words = root.querySelector('#chronlist')
    if (!words) {
        throw new Error(`Could not find element with ID 'chronlist'.`)
    }

    // Skip recent entries from the last 3 days to avoid revealing spoilers.
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - 3)

    for (const child of words.childNodes) {
        if (child.nodeType !== NodeType.TEXT_NODE) {
            continue
        }
        const entry = child.textContent.trim()
        const [word, _num, mdy] = entry.split(' ')
        const [month, day, year] = mdy.split('/')
        const yearInt = 2000 + parseInt(year)
        const monthInt = parseInt(month) - 1
        const dayInt = parseInt(day)
        const date = new Date(yearInt, monthInt, dayInt)
        if (date > thresholdDate) {
            continue
        }
        const dateString = `${yearInt}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

        result.set(word, dateString)
    }
}

const isValidWord = (word: string): boolean => {
    return word.length === 5
}

const saveWords = (words: ValidWords) => {
    const path = './public/words.json'
    console.log(`Saving words to '${path}'...`)
    fs.writeFileSync(path, JSON.stringify(words))
    console.log(`Words saved to '${path}'.`)
}

const sortWords = (validWords: ValidWords) => {
    // Sort alphabetically so that they can easily be browsed in the web page in the default view.
    // It's nice to show that some have used dates in the initial view where they are only sorted alphabetically and the used ones are at the bottom.
    const locale = 'en'
    validWords.words.sort((a, b) => {
        return a.w.localeCompare(b.w, locale)
    })
}

async function main(): Promise<void> {
    // TODO Update possible words using https://wordsrated.com/wordle-words and maybe somewhere else.
    // We're missing "MOMMY" and a few others.
    // Be fault tolerant and validate the numbers of words to ensure it's within a reasonable range.
    // Ensure a few known words are in the list.
    // Ensure each word only have 5 letters.
    await addUsedDates()

    const newValidWords = validWords as ValidWords
    sortWords(newValidWords)

    newValidWords.lastUpdated = new Date().toISOString()
    saveWords(newValidWords)
}

main()