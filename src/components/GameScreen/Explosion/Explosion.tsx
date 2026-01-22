import { useState, useEffect } from 'react'
import s from './Explosion.module.css'

interface ExplosionProps {
  x: number
  y: number
  onComplete: () => void
}

const EXPLOSION_FRAMES = [
  '/приложение самолет_Монтажная область 1 копия 12.png',
  '/приложение самолет_Монтажная область 1 копия 13.png',
  '/приложение самолет_Монтажная область 1 копия 14.png',
  '/приложение самолет_Монтажная область 1 копия 15.png',
  '/приложение самолет_Монтажная область 1 копия 16.png'
]

const Explosion = ({ x, y, onComplete }: ExplosionProps) => {
  const [currentFrame, setCurrentFrame] = useState(0)

  useEffect(() => {
    if (currentFrame >= EXPLOSION_FRAMES.length - 1) {
      // Анимация завершена
      setTimeout(() => {
        onComplete()
      }, 100)
      return
    }

    // Переключаем кадр каждые 120ms (0.6s / 5 кадров)
    const timer = setTimeout(() => {
      setCurrentFrame(prev => prev + 1)
    }, 120)

    return () => clearTimeout(timer)
  }, [currentFrame, onComplete])

  return (
    <div 
      className={s.explosion}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <img 
        src={EXPLOSION_FRAMES[currentFrame]} 
        alt="Explosion"
        className={s.explosionImage}
      />
    </div>
  )
}

export default Explosion
