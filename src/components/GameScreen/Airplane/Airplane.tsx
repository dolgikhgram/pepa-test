import s from './Airplane.module.css'

interface AirplaneProps {
  x: number
  y: number
  rotation: number
  isCrashing?: boolean
  collisionEffect?: 'bonus' | 'torpedo' | null
}

const Airplane = ({ x, y, rotation, isCrashing = false, collisionEffect = null }: AirplaneProps) => {
  return (
    <div 
      className={`${s.airplane} ${isCrashing ? s.crashing : ''} ${collisionEffect === 'torpedo' ? s.collisionTorpedo : ''} ${collisionEffect === 'bonus' ? s.collisionBonus : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        '--rotation': `${rotation}deg`
      } as React.CSSProperties}
    >
      <img 
        src="/приложение самолет_Монтажная область 1.png" 
        alt="Airplane"
        className={s.airplaneImage}
      />
    </div>
  )
}

export default Airplane

