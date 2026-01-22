import { type Torpedo as TorpedoType } from '../types/types'
import s from './Torpedo.module.css'

interface TorpedoProps {
  torpedo: TorpedoType
}

const Torpedo = ({ torpedo }: TorpedoProps) => {
  if (torpedo.isHit) return null

  return (
    <div 
      className={`${s.torpedo} ${torpedo.isWarning ? s.torpedoWarning : ''}`}
      style={{
        left: `${torpedo.x}px`,
        top: `${torpedo.y}px`,
      }}
    >
      {torpedo.isWarning && <div className={s.torpedoWarningGlow}></div>}
      <img 
        src="/приложение самолет_Монтажная область 1 копия 11.png" 
        alt="Torpedo"
        className={s.torpedoImage}
      />
    </div>
  )
}

export default Torpedo

