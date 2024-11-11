import axios from 'axios'
import * as fs from 'fs'
import { NodeType, parse } from 'node-html-parser'
import validWords from '../public/words.json'

async function getUsedWords(): Promise<Map<string, string>> {
    const url = 'https://www.fiveforks.com/wordle'
    const result = new Map<string, string>()
    console.log(`Fetching '${url}'...`)
    try {
        const response = await axios.get(url)
        const html = response.data
        const root = parse(html);

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
    } catch (error) {
        console.error(`Error fetching or parsing HTML from '${url}'.`, error);
        throw error
    }

    return result
}

function isValidWord(word: string): boolean {
    return word.length === 5
}

function saveWords(words: typeof validWords) {
    const path = './public/words.json'
    console.log(`Saving words to '${path}'...`)
    fs.writeFileSync(path, JSON.stringify(words))
    console.log(`Words saved to '${path}'.`)
}

async function addUsedDates() {
    const usedWords = await getUsedWords()
    for (const word of validWords.words) {
        const date = usedWords.get(word.w)
        if (date) {
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

    saveWords(validWords)
}

async function main() {
    // TODO Update possible words using https://wordsrated.com/wordle-words and maybe somewhere else.
    // We're missing "MOMMY" and a few others.
    // Be fault tolerant and validate the numbers of words to ensure it's within a reasonable range.
    // Ensure a few known words are in the list.
    // Ensure each word only have 5 letters.
    await addUsedDates()
}

main()