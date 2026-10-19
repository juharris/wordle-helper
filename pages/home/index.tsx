'use client'

import styles from '@/pages/index.module.css'
import { ValidWords, WordleFilter, WordleFilterResponse, WordleState } from 'app/solver/filter'
import Head from 'next/head'
import { useRouter } from 'next/router'
import allValidWords from 'public/words.json'
import { useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import PossibleSolution from '../../components/possible-solution'

function areWordsOld(): boolean {
  const dateString = getTodayDateString()
  return findSolution(dateString) === undefined
}

function findSolution(dateString: string): string | undefined {
  const validWords = allValidWords as ValidWords
  return validWords.words
    .find(w => w.d === dateString)?.w
}

function getInitialWordleState(): WordleState {
  return {
    banned: [],
    hints: ["", "", "", "", ""],
    known: ["", "", "", "", ""],
  }
}

function getWordleStateAfterGuess(state: WordleState, guess: string, solution: string): WordleState {
  const known = [...state.known]
  const hints = [...state.hints]
  const banned = new Set(state.banned)
  const remainingLetters = new Map<string, number>()

  for (const letter of solution) {
    remainingLetters.set(letter, (remainingLetters.get(letter) || 0) + 1)
  }

  for (let i = 0; i < guess.length; ++i) {
    if (guess[i] === solution[i]) {
      known[i] = guess[i]
      remainingLetters.set(guess[i], remainingLetters.get(guess[i])! - 1)
    }
  }

  for (let i = 0; i < guess.length; ++i) {
    const letter = guess[i]
    if (letter === solution[i]) {
      continue
    }

    const remainingCount = remainingLetters.get(letter) || 0
    if (remainingCount > 0) {
      if (!hints[i].includes(letter)) {
        hints[i] += letter
      }
      remainingLetters.set(letter, remainingCount - 1)
    } else if (!solution.includes(letter)) {
      banned.add(letter)
    }
  }

  return {
    known,
    hints,
    banned: Array.from(banned),
  }
}

function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const [guessWord, setGuessWord] = useState("")
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

  const getTodaySolution = (): string | null => {
    const dateString = getTodayDateString()

    // Check if we already have today's solution in memory
    if (todaySolution && todaySolution.date === dateString) {
      return todaySolution.word
    }

    const todayWord = findSolution(dateString)

    if (todayWord) {
      setTodaySolution({ date: dateString, word: todayWord })
      return todayWord
    }

    setTodaySolution(null)

    return null
  }

  const tryWordAgainstToday = (word: string) => {
    const solution = getTodaySolution()
    if (!solution) {
      alert("Today's solution is not available in the data yet. Try refreshing the page.")
      return
    }

    const newWordleState = getWordleStateAfterGuess(wordleState, word, solution)
    updateCandidates(true, newWordleState)
  }

  const handleReset = () => {
    setAreWordsOldState(areWordsOld())
    setGuessWord("")
    updateCandidates(false, getInitialWordleState())
  }

  const handleGuessSubmit = () => {
    const normalizedGuess = guessWord.trim().toUpperCase()
    if (!/^[A-Z]{5}$/.test(normalizedGuess)) {
      alert('Enter a 5-letter word.')
      return
    }

    tryWordAgainstToday(normalizedGuess)
    setGuessWord("")
  }

  const numLetters = 5
  const hintInputs = []
  const todayWordForPreview = findSolution(getTodayDateString())
  const visibleWordleState = guessWord && todayWordForPreview
    ? getWordleStateAfterGuess(wordleState, guessWord, todayWordForPreview)
    : wordleState
  const visibleFilterResponse = guessWord
    ? wordleFilter.current.filter(visibleWordleState, allValidWords, enableRanking)
    : filterResponse
  const today = WordleFilter.getTodayMidnight()
  let numUnusedSolutions = 0
  for (const candidate of visibleFilterResponse.candidates) {
    if (candidate.d === undefined || WordleFilter.parseLocalDate(candidate.d) >= today) {
      ++numUnusedSolutions
    }
  }

  for (let i = 0; i < numLetters; ++i) {
    hintInputs.push(
      <input type='text' key={i}
        id={`hint-${i}`}
        aria-label={`Hint for letter ${i + 1}`}
        autoComplete='off'
        className={`${styles.wordleLetters} ${styles.hints} ${styles.oneFifth}`}
        value={visibleWordleState.hints[i]}
        onChange={(e) => {
          const hints = [...wordleState.hints]
          const previousLength = hints[i].length
          hints[i] = e.target.value.toUpperCase()
          const newWordleState = {
            ...wordleState,
            hints,
          }
          const isMoreRestrictive = hints[i].length > previousLength
          updateCandidates(isMoreRestrictive, newWordleState)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && !visibleWordleState.hints[i]) {
            // If backspace is pressed on an empty input, focus the previous input and delete its last character.
            const prevIndex = i - 1
            if (prevIndex >= 0) {
              e.preventDefault()
              const hints = [...wordleState.hints]
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
        value={visibleWordleState.known[i]}
        onChange={(e) => {
          const known = [...wordleState.known]
          let { value } = e.target
          if (value.length > 1) {
            // Get just the last letter.
            value = value.substring(value.length - 1)
          }
          const previousLength = known[i].length
          known[i] = value.toUpperCase()
          const newWordleState = {
            ...wordleState,
            known,
          }
          const isMoreRestrictive = value.length > previousLength
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
          if (e.key === 'Backspace' && !visibleWordleState.known[i]) {
            // If backspace is pressed on an empty input, focus the previous input and delete its last character
            const prevIndex = i - 1
            if (prevIndex >= 0) {
              e.preventDefault()
              const known = [...wordleState.known]
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

  // Input box for typing a word and upon submission,
  // the state is updated as if that word was tried against today's solution.
  const guessSection = (<>
    <div className={styles.grid}>
      Guess:
      <input type='text'
        id='guess-input'
        aria-label='Guess word'
        autoComplete='off'
        className={`${styles.wordleLetters} ${styles.guess}`}
        value={guessWord}
        minLength={5}
        maxLength={5}
        onChange={(e) => {
          const lettersOnly = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
          setGuessWord(lettersOnly)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleGuessSubmit()
          }
        }}
      />
      <button className={styles.resetButton}
        title="Apply guess"
        type='button'
        onClick={handleGuessSubmit}
      >
        ➤
      </button>
    </div>
  </>)

  return (
    <div className={styles.container}>
      <Head>
        <title>Wordle Helper</title>
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
      </Head>

      <main>
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
              value={visibleWordleState.banned.join("")}
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

        <div className={styles.inputsSection}>
          {guessSection}
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
          Possible Solutions ({visibleFilterResponse.candidates.length > 0 ? `${numUnusedSolutions}/` : ""}{visibleFilterResponse.candidates.length}):
          <FixedSizeList
            className={styles.possibleSolutionsList}
            height={520}
            itemCount={visibleFilterResponse.candidates.length}
            itemData={{ candidates: visibleFilterResponse.candidates, onTryWord: tryWordAgainstToday }}
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