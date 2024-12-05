import styles from '@/pages/index.module.css';
import { WordleFilter, WordleSolutionCandidate, WordleState } from 'app/solver/filter';
import Head from 'next/head';
import validWords from 'public/words.json';
import { useRef, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';


const PossibleSolution = ({ data, index, style }: ListChildComponentProps) => {
  const candidate: WordleSolutionCandidate = data[index]
  let date: string | undefined = undefined
  if (candidate.d) {
    const [year, month, day] = candidate.d.split('-')
    const yearInt = parseInt(year, 10)
    const monthInt = parseInt(month, 10) - 1
    const dayInt = parseInt(day, 10)
    date = new Date(yearInt, monthInt, dayInt).toDateString()
  }
  return (<div key={candidate.w} style={style}>
    <span className={styles.possibleSolutionWord}>
      {candidate.w}
    </span>
    {date && <span className={styles.wordDate}>
      <span className={styles.calendarIcon}>📅</span>
      {date}
    </span>}
  </div>);
}

export default function Home() {
  const [wordleState, setWordleState] = useState<WordleState>({
    banned: [],
    hints: ["", "", "", "", ""],
    known: ["", "", "", "", ""],
  })

  const wordleFilter = useRef(new WordleFilter(validWords))
  const response = wordleFilter.current.filter(wordleState)
  let numUnusedSolutions = 0
  for (const candidate of response.candidates) {
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
          Possible Solutions ({response.candidates.length > 0 ? `${numUnusedSolutions}/` : ""}{response.candidates.length}):
          <FixedSizeList
            className={styles.possibleSolutionsList}
            height={520}
            itemCount={response.candidates.length}
            itemData={response.candidates}
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
