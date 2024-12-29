import styles from '@/pages/index.module.css';
import { WordleFilter, WordleFilterResponse, WordleState } from 'app/solver/filter';
import Head from 'next/head';
import allValidWords from 'public/words.json';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { PossibleSolution } from './possible-solution';

function getInitialWordleState(): WordleState | (() => WordleState) {
  return {
    banned: [],
    hints: ["", "", "", "", ""],
    known: ["", "", "", "", ""],
  };
}

export default function Home() {
  const [wordleState, setWordleState] = useState<WordleState>(getInitialWordleState())
  const wordleFilter = useRef(new WordleFilter(allValidWords))
  const [filterResponse, setFilterResponse] = useState<WordleFilterResponse | undefined>(undefined)

  useEffect(() => {
    setFilterResponse(wordleFilter.current.filter(wordleState))
  }, [wordleState])

  if (!filterResponse) {
    // Let the effect call `setFilterResponse` before rendering.
    return (<></>)
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
        aria-label={`Hint for letter ${i + 1}`}
        className={`${styles.wordleLetters} ${styles.hints} ${styles.oneFifth}`}
        value={wordleState.hints[i]}
        onChange={(e) => {
          const { hints } = wordleState
          hints[i] = e.target.value.toUpperCase()
          setWordleState({
            ...wordleState,
            hints,
          })
        }
        }
      />
    )
  }

  const knownInputs = []
  for (let i = 0; i < numLetters; ++i) {
    knownInputs.push(
      <input type='text' key={i}
        id={`known-${i}`}
        aria-label={`Answer for letter ${i + 1}`}
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
          setWordleState({
            ...wordleState,
            known,
          })

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
      />
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Wordle Helper</title>
        {/* TODO Add new favicon.
        <link rel='icon' href='/favicon.ico' />
        */}
      </Head>

      <main>
        <h1 className={styles.title}>
          Wordle Helper
        </h1>

        <div className={styles.grid}>
          <div className={styles.inputsSection}>
            <div>
              Letters not in the word:
            </div>
            <input type='text'
              aria-label="banned letters"
              className={`${styles.wordleLetters} ${styles.banned}`}
              value={wordleState.banned.join("")}
              onChange={(e) => {
                const { value } = e.target
                const banned = value.toUpperCase().split("")
                setWordleState({
                  ...wordleState,
                  banned,
                })
              }}
            />
          </div>
          <div>
            <button className={styles.resetButton}
              title="Reset all inputs"
              type='button'
              onClick={() => setWordleState(getInitialWordleState())}
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
          Possible Solutions ({filterResponse.candidates.length > 0 ? `${numUnusedSolutions}/` : ""}{filterResponse.candidates.length}):
          <FixedSizeList
            className={styles.possibleSolutionsList}
            height={520}
            itemCount={filterResponse.candidates.length}
            itemData={filterResponse.candidates}
            itemSize={25}
            width={300}
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
  );
}