import Head from 'next/head';
import styles from '@/pages/index.module.css';
import { useState } from 'react';
import { WordleFilter, WordleState } from 'app/solver/filter';
import candidates from 'public/words.json';

export default function Home() {
  const [wordleState, setWordleState] = useState<WordleState>({
    banned: [],
    hints: ["", "", "", "", ""],
    known: ["", "", "", "", ""],
  })

  const wordleFilter = new WordleFilter(candidates)
  const response = wordleFilter.filter(wordleState)

  const hintInputs = []
  for (let i = 0; i < 5; ++i) {
    hintInputs.push(
      <input type='text' key={i}
        className={styles.wordleLetters}
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
        className={styles.wordleLetters}
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
        {/* <link rel='icon' href='/favicon.ico' /> */}
      </Head>

      <main>
        <div>
          <div>
            Banned Letters:
          </div>
          <input type='text' id='banned'
            className={styles.wordleLetters}
            value={wordleState.banned.join("")}
            onChange={(e) => setWordleState({
              ...wordleState,
              banned: e.target.value.toUpperCase().split("")
            })}
          />
        </div>

        <div>
          Hints:
          <div>
            {hintInputs}
          </div>
        </div>

        <div>
          Known:
          <div>
            {knownInputs}
          </div>
        </div>

        <div>
          Possible Solutions ({response.candidates.length}):
          <div>
            {response.candidates.map((candidate, i) =>
            (<div key={i}>
              {candidate.w}
              {candidate.d && `Used on ${candidate.d}`}
            </div>)
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        {/*
        <a
          href='https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app'
          target='_blank'
          rel='noopener noreferrer'
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src='/vercel.svg' alt='Vercel Logo' width={72} height={16} />
          </span>
        </a>
        */}
      </footer>
    </div>
  );
}
