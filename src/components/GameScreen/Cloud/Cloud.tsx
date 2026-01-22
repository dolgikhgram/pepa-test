import s from './Cloud.module.css'

interface CloudProps {
  imageIndex: number
  top: number
  speed: number
  delay: number
}

const Cloud = ({ imageIndex, top, speed, delay }: CloudProps) => {
const cloudImages = [
  '/приложение самолет_Монтажная область 1 копия 2.png',
  '/приложение самолет_Монтажная область 1 копия 3.png',
  '/приложение самолет_Монтажная область 1 копия 4.png',
  '/приложение самолет_Монтажная область 1 копия 5.png',
  '/приложение самолет_Монтажная область 1 копия 6.png',
  '/приложение самолет_Монтажная область 1 копия 7.png',
  '/приложение самолет_Монтажная область 1 копия 8.png',
  '/приложение самолет_Монтажная область 1 копия 9.png',
]

  return (
    <div
      className={s.cloud}
      style={{
        top: `${top}%`,
        animationDuration: `${speed}s`,
        animationDelay: `${delay}s`,
      }}
    >
      <img
        src={cloudImages[imageIndex]}
        alt={`Cloud ${imageIndex + 1}`}
        className={s.cloudImage}
      />
    </div>
  )
}

export default Cloud
