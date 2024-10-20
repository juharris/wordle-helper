import * as fs from 'fs';
import validWords from '../public/words.json';

function saveWords() {
    const path = './public/words.json'
    console.log(`Saving words to '${path}'...`)
    fs.writeFileSync(path, JSON.stringify(validWords))
    console.log(`Words saved to '${path}'.`)
}

function addUsedDates() {
    // TODO Load dates.
    saveWords()
}

function main() {
    addUsedDates()
}

main()