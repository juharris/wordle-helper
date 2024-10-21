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

        const chronlist = root.querySelector('#chronlist')
        if (!chronlist) {
            throw new Error(`Could not find element with ID 'chronlist'.`)
        }
        for (const child of chronlist.childNodes) {
            if (child.nodeType !== NodeType.TEXT_NODE) {
                continue
            }
            const entry = child.textContent.trim()
            const [word, num, mdy] = entry.split(' ')
            const [month, day, year] = mdy.split('/')
            const date = `${2000 + parseInt(year)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            result.set(word, date)
        }
    } catch (error) {
        console.error(`Error fetching or parsing HTML from '${url}'.`, error);
        throw error
    }

    return result
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
            (word as any).d = date
        }
    }
    saveWords(validWords)
}

async function main() {
    await addUsedDates()
}

main()