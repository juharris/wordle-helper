import styles from '@/pages/index.module.css'
import { WordleFilter, WordleSolutionCandidate } from 'app/solver/filter'
import { ListChildComponentProps } from 'react-window'

interface PossibleSolutionData {
  candidates: WordleSolutionCandidate[]
  onTryWord: (word: string) => void
}

export default function PossibleSolution({ data, index, style }: ListChildComponentProps) {
  const { candidates, onTryWord } = data as PossibleSolutionData
  const candidate: WordleSolutionCandidate = candidates[index]
  let date: string | undefined = undefined
  if (candidate.d) {
    // Only show if the date is before today.
    const usedDate = WordleFilter.parseLocalDate(candidate.d)
    const today = WordleFilter.getTodayMidnight()
    if (usedDate < today) {
      date = usedDate.toDateString()
    }
  }
  return (<div key={candidate.w} style={style} className={styles.possibleSolutionContainer}>
    <button
      className={styles.tryButton}
      onClick={() => onTryWord(candidate.w)}
      title={`Try ${candidate.w} for today's Wordle`}
    >
      🔍
    </button>
    <span className={styles.possibleSolutionWord}>
      {candidate.w}
    </span>
    {candidate.score !== undefined && <span className={styles.wordScore}>
      {candidate.score}
    </span>}
    {date && <span className={styles.wordDate}>
      <span className={styles.calendarIcon}>📅</span>
      {date}
    </span>}
  </div>);
}