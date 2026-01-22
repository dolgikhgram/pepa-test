import { type Bonus as BonusType } from '../types/types'
import s from './Bonus.module.css'

interface BonusProps {
  bonus: BonusType
}

const Bonus = ({ bonus }: BonusProps) => {
  if (bonus.isCollected) return null

  const displayText = bonus.type === 'multiplier' 
    ? `x${bonus.value}` 
    : `+${bonus.value}`

  return (
    <div 
      className={`${s.bonus} ${s[bonus.type]}`}
      style={{
        left: `${bonus.x}px`,
        top: `${bonus.y}px`,
      }}
    >
      <div className={s.value}>
        {displayText}
      </div>
    </div>
  )
}

export default Bonus

