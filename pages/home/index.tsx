'use client'

import styles from '@/pages/index.module.css'
import { ValidWords, WordleFilter, WordleFilterResponse, WordleState } from 'app/solver/filter'
import Head from 'next/head'
import { useRouter } from 'next/router'
import allValidWords from 'public/words.json'
import { useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import PossibleSolution from '../../components/possible-solution'

const getInitialWordleState = (): WordleState => {
  return {
    banned: [],
    hints: ["", "", "", "", ""],
    known: ["", "", "", "", ""],
  }
}

const areWordsOld = (): boolean => {
  // Disable because to source blocks GitHub Actions from updating the words.
  return false
  /*
  // Check if the page is more than 4 days old.
  // The words should refresh every 2 days, but we'll give it a buffer in case an update fails;
  // otherwise, there would be a refresh loop.
  // A more robut implementation would not refresh the entire page and just get the latest words,
  // however, this is simpler and the format of the words might not be compatible with the page.
  if (allValidWords.lastUpdated === undefined) {
    return true
  }
  const dateResetThreshold = new Date()
  dateResetThreshold.setDate(dateResetThreshold.getDate() - 4)
  return new Date(allValidWords.lastUpdated) < dateResetThreshold
  */
}

export default function Home(): JSX.Element {
  // Eagerly check the URL parameters to determine if ranking should be enabled.
  let enableRankingDefault = false
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    enableRankingDefault = urlParams.get('rank') === 'true'
  }

  const router = useRouter()
  const [areWordsOldState, setAreWordsOldState] = useState(areWordsOld())
  const [enableRanking, setEnableRanking] = useState(enableRankingDefault)
  const [wordleState, setWordleState] = useState<WordleState>(getInitialWordleState())
  const wordleFilter = useRef(new WordleFilter())
  const [filterResponse, setFilterResponse] = useState<WordleFilterResponse | undefined>(undefined)
  const [todaySolution, setTodaySolution] = useState<{ date: string; word: string } | null>(null)

  // Handle ranking toggling and the initial page load.
  useEffect(() => {
    // Handles initializing the possible solutions and updating them if ranking is toggled.
    const possibleSolutions: ValidWords = filterResponse?.candidates ?
      { words: filterResponse.candidates }
      : allValidWords
    setFilterResponse(wordleFilter.current.filter(wordleState, possibleSolutions, enableRanking))

    // Update the URL to set the `rank` URL parameter.
    const query = { ...router.query }
    if (enableRanking) {
      query.rank = 'true'
    } else {
      delete query.rank
    }

    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }, [enableRanking])

  if (!filterResponse) {
    // Let the effect call `setFilterResponse` before rendering.
    return (<></>)
  }

  const updateCandidates = (isMoreRestrictive: boolean, newWordleState: WordleState) => {
    setWordleState(newWordleState)
    if (isMoreRestrictive) {
      // A new restriction was added so filter out from the current candidates.
      setFilterResponse(wordleFilter.current.filter(newWordleState, { words: filterResponse.candidates }, enableRanking))
    } else {
      // A restriction was removed so filter from the full list of words.
      setFilterResponse(wordleFilter.current.filter(newWordleState, allValidWords, enableRanking))
    }
  }

  const getTodayDateString = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTodaySolution = (): string | null => {
    const dateString = getTodayDateString()
    
    // Check if we already have today's solution in memory
    if (todaySolution && todaySolution.date === dateString) {
      return todaySolution.word
    }

    // Find today's word from the local data
    const validWords = allValidWords as ValidWords
    const todayWord = validWords.words.find(w => w.d === dateString)
    
    if (todayWord) {
      setTodaySolution({ date: dateString, word: todayWord.w })
      return todayWord.w
    }
    
    return null
  }

  const tryWordAgainstToday = (word: string) => {
    const solution = getTodaySolution()
    if (!solution) {
      alert('Today\'s solution is not available in the data yet.')
      return
    }

    // Compare word with solution and merge with existing state
    const newKnown: string[] = [...wordleState.known]
    const newHints: string[] = [...wordleState.hints]
    const bannedSet = new Set<string>(wordleState.banned)

    // First pass: mark correct letters (green)
    for (let i = 0; i < 5; i++) {
      if (word[i] === solution[i]) {
        newKnown[i] = word[i]
      }
    }

    // Second pass: mark letters that are in the word but in wrong position (yellow)
    for (let i = 0; i < 5; i++) {
      if (word[i] !== solution[i]) {
        if (solution.includes(word[i])) {
          // Letter is in the word but not at this position
          if (!newHints[i].includes(word[i])) {
            newHints[i] += word[i]
          }
        } else {
          // Letter is not in the word at all
          bannedSet.add(word[i])
        }
      }
    }

    const newWordleState: WordleState = {
      known: newKnown,
      hints: newHints,
      banned: Array.from(bannedSet),
    }

    updateCandidates(true, newWordleState)
  }

  const handleReset = () => {
    setAreWordsOldState(areWordsOld())
    updateCandidates(false, getInitialWordleState())
  }

  let numUnusedSolutions = 0
  for (const candidate of filterResponse.candidates) {
    if (candidate.d === undefined) {
      ++numUnusedSolutions
    }
  }

  const numLetters = 5
  const hintInputs = []
  for (let i = 0; i < numLetters; ++i) {
    hintInputs.push(
      <input type='text' key={i}
        id={`hint-${i}`}
        aria-label={`Hint for letter ${i + 1}`}
        autoComplete='off'
        className={`${styles.wordleLetters} ${styles.hints} ${styles.oneFifth}`}
        value={wordleState.hints[i]}
        onChange={(e) => {
          const { hints } = wordleState
          hints[i] = e.target.value.toUpperCase()
          const newWordleState = {
            ...wordleState,
            hints,
          }
          const isMoreRestrictive = hints[i].length > wordleState.hints[i].length
          updateCandidates(isMoreRestrictive, newWordleState)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && !wordleState.hints[i]) {
            // If backspace is pressed on an empty input, focus the previous input and delete its last character.
            const prevIndex = i - 1
            if (prevIndex >= 0) {
              e.preventDefault()
              const { hints } = wordleState
              hints[prevIndex] = hints[prevIndex].slice(0, -1)
              const newWordleState = {
                ...wordleState,
                hints,
              }
              updateCandidates(false, newWordleState)
              const prevInput = document.getElementById(`hint-${prevIndex}`)
              if (prevInput instanceof HTMLInputElement) {
                prevInput.focus()
              }
            }
          }
        }}
      />
    )
  }

  const knownInputs = []
  for (let i = 0; i < numLetters; ++i) {
    knownInputs.push(
      <input type='text' key={i}
        id={`known-${i}`}
        aria-label={`Answer for letter ${i + 1}`}
        autoComplete='off'
        className={`${styles.wordleLetters} ${styles.known} ${styles.oneFifth}`}
        value={wordleState.known[i]}
        onChange={(e) => {
          const { known } = wordleState
          let { value } = e.target
          if (value.length > 1) {
            // Get just the last letter.
            value = value.substring(value.length - 1)
          }
          known[i] = value.toUpperCase()
          const newWordleState = {
            ...wordleState,
            known,
          }
          const isMoreRestrictive = value.length > wordleState.known[i].length
          updateCandidates(isMoreRestrictive, newWordleState)

          if (value) {
            // Try to skip to the next input.
            const nextIndex = i + 1
            if (nextIndex < numLetters) {
              const nextInput = document.getElementById(`known-${nextIndex}`)
              if (nextInput instanceof HTMLInputElement) {
                nextInput.focus()
              }
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && !wordleState.known[i]) {
            // If backspace is pressed on an empty input, focus the previous input and delete its last character
            const prevIndex = i - 1
            if (prevIndex >= 0) {
              e.preventDefault()
              const { known } = wordleState
              known[prevIndex] = known[prevIndex].slice(0, -1)
              const newWordleState = {
                ...wordleState,
                known,
              }
              updateCandidates(false, newWordleState)
              const prevInput = document.getElementById(`known-${prevIndex}`)
              if (prevInput instanceof HTMLInputElement) {
                prevInput.focus()
              }
            }
          }
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Wordle Helper</title>
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
      </Head>

      <main>
        <h1 className={styles.title}>
          Wordle Helper
        </h1>

        {areWordsOldState &&
          <div>
            ⚠️ The words are more than a few days old. Please refresh the page to get the latest words.
          </div>
          }

        <div className={styles.grid}>
          <div className={styles.inputsSection}>
            <div>
              Letters not in the word:
            </div>
            <input type='text'
              aria-label="banned letters"
              autoComplete='off'
              className={`${styles.wordleLetters} ${styles.banned}`}
              value={wordleState.banned.join("")}
              onChange={(e) => {
                const prevBanned = wordleState.banned
                const { value } = e.target
                const banned = value.toUpperCase().split("")
                const newWordleState = {
                  ...wordleState,
                  banned,
                }
                const isMoreRestrictive = banned.length > prevBanned.length
                updateCandidates(isMoreRestrictive, newWordleState)
              }}
            />
          </div>
          <div>
            <button className={styles.resetButton}
              title="Reset all inputs"
              type='button'
              onClick={handleReset}
            >
              🗑️
            </button>
          </div>
        </div>

        <div className={styles.inputsSection}>
          Letters in the word, but not at these places:
          <div className={styles.grid}>
            {hintInputs}
          </div>
        </div>

        <div className={styles.inputsSection}>
          Letters in the word in the right place:
          <div className={styles.grid}>
            {knownInputs}
          </div>
        </div>

        <div className={styles.possibleSolutions}>
          <button className={styles.rankButton}
            title="Toggle ranking"
            type='button'
            onClick={() => {
              setEnableRanking(!enableRanking)
            }}
          >
            {enableRanking ? "🔠" : "✨"}
          </button>
          Possible Solutions ({filterResponse.candidates.length > 0 ? `${numUnusedSolutions}/` : ""}{filterResponse.candidates.length}):
          <FixedSizeList
            className={styles.possibleSolutionsList}
            height={520}
            itemCount={filterResponse.candidates.length}
            itemData={{ candidates: filterResponse.candidates, onTryWord: tryWordAgainstToday }}
            itemSize={25}
            width={300}
            // Ensure the list is updated when the candidates change,
            // otherwise, scrolling may be required when the candidates do not change in size.
            key={Math.random()}
          >
            {PossibleSolution}
          </FixedSizeList>
        </div>
      </main>

      <footer className={styles.footer}>
        {/* Using `&nbsp;` is hacky, but the CSS in this footer is weird and `{" "}` didn't show. */}
        Source code:&nbsp;
        <a href='https://github.com/juharris/wordle-helper'
          target='_blank'
          rel='noopener noreferrer'
        >
          github.com/juharris/wordle-helper
        </a>
      </footer>
    </div>
  )
}