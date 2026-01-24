import { ValidWords } from 'app/solver/filter'
import axios from 'axios'
import * as fs from 'fs'
import validWords from '../public/words.json'

const addUsedDates = async () => {
    const words = validWords as ValidWords

    // Find the latest used date from existing words
    const latestDate = words.words.reduce((max: Date | null, word) => {
        if (!word.d) return max
        const date = new Date(word.d)
        return !max || date > max ? date : max
    }, null)

    if (!latestDate) {
        throw new Error('No dates found in words.')
    }

    // Determine the start date (day after latest date)
    const startDate = new Date(latestDate)
    startDate.setDate(startDate.getDate() + 1)

    // End date is yesterday (to avoid spoilers for today)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    endDate.setHours(0, 0, 0, 0)

    if (startDate >= endDate) {
        console.log("No new dates to fetch.")
        return
    }

    console.log(`Fetching Wordle answers from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`)

    // Fetch each day's answer from NYT API
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        // YYYY-MM-DD format
        const dateString = currentDate.toISOString().split('T')[0]
        const word = await getWordleAnswer(dateString)

        if (word) {
            // Check if word already exists
            const existingWord = words.words.find(w => w.w === word)
            if (existingWord) {
                if (!existingWord.d) {
                    console.log(`Adding date "${dateString}" to existing word "${word}".`)
                    existingWord.d = dateString
                }
            } else {
                console.log(`Adding new word "${word}" with date "${dateString}".`)
                words.words.push({ w: word, s: ['nyt'], d: dateString })
            }
        }
    }
}

const getWordleAnswer = async (dateString: string): Promise<string | null> => {
    const url = `https://www.nytimes.com/svc/wordle/v2/${dateString}.json`
    try {
        const response = await axios.get(url)
        const word = response.data.solution
        if (word && isValidWord(word)) {
            const upperWord = word.toUpperCase()
            return upperWord
        }
        return null
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            // No Wordle for this date (likely before Wordle started or in the future)
            console.error(`No Wordle answer found for ${dateString}`)
        } else {
            console.error(`Error fetching Wordle answer for ${dateString}:`, error)
        }
        return null
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