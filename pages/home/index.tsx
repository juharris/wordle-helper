import Head from 'next/head';
import styles from '@/pages/index.module.css';
import { useState } from 'react';
import { WordleFilter, WordleState } from 'app/solver/filter';
import validWords from 'public/words.json';

export default function Home() {
  const [wordleState, setWordleState] = useState<WordleState>({
    banned: [],
    hints: ["", "", "", "", ""],
    known: ["", "", "", "", ""],
  })

  const wordleFilter = new WordleFilter(validWords)
  const response = wordleFilter.filter(wordleState)

  const hintInputs = []
  for (let i = 0; i < 5; ++i) {
    hintInputs.push(
      <input type='text' key={i}
        className={`${styles.wordleLetters} ${styles.oneFifth}`}
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
  for (let i = 0; i < 5; ++i) {
    knownInputs.push(
      <input type='text' key={i}
        className={`${styles.wordleLetters} ${styles.oneFifth}`}
        value={wordleState.known[i]}
        onChange={(e) => {
          const { known } = wordleState
          known[i] = e.target.value.toUpperCase()
          setWordleState({
            ...wordleState,
            known,
          })
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

        <p className={styles.description}>
          Fill in the information below to get possible solutions.
        </p>

        <div className={styles.inputsSection}>
          <div>
            Banned Letters:
          </div>
          <input type='text'
            className={`${styles.wordleLetters} ${styles.banned}`}
            value={wordleState.banned.join("")}
            onChange={(e) => setWordleState({
              ...wordleState,
              banned: e.target.value.toUpperCase().split("")
            })}
          />
        </div>

        <div className={styles.inputsSection}>
          Hints:
          <div className={styles.grid}>
            {hintInputs}
          </div>
        </div>

        <div className={styles.inputsSection}>
          Known:
          <div className={styles.grid}>
            {knownInputs}
          </div>
        </div>

        <div>
          Possible Solutions ({response.candidates.length}):
          <div>
            {response.candidates.map((candidate) =>
            (<div key={candidate.w}>
              {candidate.w}
              {candidate.d &&
                <span title={candidate.d}>📅</span>
              }
            </div>)
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
