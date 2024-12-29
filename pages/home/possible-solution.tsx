import styles from '@/pages/index.module.css';
import { WordleSolutionCandidate } from 'app/solver/filter';
import { ListChildComponentProps } from 'react-window';

export default function PossibleSolution({ data, index, style }: ListChildComponentProps) {
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