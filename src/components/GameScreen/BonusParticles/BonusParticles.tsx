import { useEffect, useState } from 'react'
import s from './BonusParticles.module.css'

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface BonusParticlesProps {
  x: number
  y: number
  value: number
  type: 'multiplier' | 'additive'
  isActive: boolean
}

const BonusParticles = ({ x, y, value, type, isActive }: BonusParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (isActive) {
      // Создаем 12 партиклов
      const newParticles: Particle[] = []
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12
        const speed = 2 + Math.random() * 2
        newParticles.push({
          id: `particle-${i}-${Date.now()}`,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0
        })
      }
      setParticles(newParticles)

      // Анимация партиклов
      const startTime = performance.now()
      const duration = 800 // 800ms

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = elapsed / duration

        if (progress < 1) {
          setParticles(prev => 
            prev.map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy - 0.5, // гравитация
              life: 1 - progress,
              vx: p.vx * 0.98,
              vy: p.vy * 0.98
            }))
          )
          requestAnimationFrame(animate)
        } else {
          setParticles([])
        }
      }

      requestAnimationFrame(animate)
    }
  }, [isActive])

  if (!isActive || particles.length === 0) return null

  const displayText = type === 'multiplier' ? `x${value}` : `+${value}`

  return (
    <div 
      className={s.particlesContainer}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`${s.particle} ${s[type]}`}
          style={{
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            opacity: particle.life,
          }}
        >
          {displayText}
        </div>
      ))}
    </div>
  )
}

export default BonusParticles

