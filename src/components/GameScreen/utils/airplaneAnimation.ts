import { type Airplane } from '../types/types'

// Easing функция для плавной анимации (ease-out)
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

interface TakeoffParams {
  startX: number
  startY: number
  speed: 'normal' | 'fast'
  onUpdate: (airplane: Partial<Airplane>) => void
  onComplete: () => void
}

export const animateTakeoff = ({
  startX,
  startY,
  speed,
  onUpdate,
  onComplete
}: TakeoffParams) => {
  // Длительность анимации в миллисекундах
  const duration = speed === 'normal' 
    ? 2000 + Math.random() * 1000 // 2-3 секунды для Normal
    : 1000 + Math.random() * 500  // 1-1.5 секунды для Fast
  
  // Целевая позиция Y - центр неба (25% от верха, так как небо занимает 50% высоты)
  // Но ограничим 20-30% для безопасности
  const targetY = 25
  
  // Вычисляем расстояние по Y до центра неба
  const yDistance = startY - targetY
  
  // Целевая позиция X - центр экрана (примерно 240px для ширины 480px)
  const targetX = 240
  // Вычисляем расстояние по X до центра
  const xDistance = targetX - startX
  
  // Начальное время
  const startTime = performance.now()
  
  // Базовая скорость горизонтального движения (пикселей в секунду)
  const baseSpeedX = speed === 'normal' ? 150 : 250
  
  let animationFrameId: number
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1) // 0 до 1
    
    // Применяем easing функцию для плавного взлета
    const easedProgress = easeOutCubic(progress)
    
    // Вычисляем новую позицию
    // Y: движение вверх до центра неба
    const newY = startY - (yDistance * easedProgress)
    
    // X: плавное движение к центру экрана
    const newX = startX + (xDistance * easedProgress)
    
    // Угол поворота: от 0° до -30° (вверх) в начале, затем возврат к 0° в конце
    let rotation: number
    if (progress < 0.5) {
      // Первая половина - подъем с наклоном вверх
      rotation = -30 * (progress * 2)
    } else {
      // Вторая половина - выравнивание
      rotation = -30 + (30 * ((progress - 0.5) * 2))
    }
    
    // Скорость: ускорение от 0 до базовой скорости
    const currentSpeed = baseSpeedX * easedProgress
    
    // После взлета самолет летит горизонтально, поэтому angle = 0
    const angleRad = 0
    const velocityX = baseSpeedX // постоянная скорость вправо
    const velocityY = 0 // горизонтальный полет
    
    // Обновляем состояние самолета
    onUpdate({
      x: newX,
      y: newY,
      rotation: rotation,
      speed: currentSpeed,
      angle: angleRad,
      velocityX: velocityX,
      velocityY: velocityY
    })
    
    // Продолжаем анимацию или завершаем
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    } else {
      // Анимация завершена - самолет в центре неба и экрана
      onUpdate({
        x: targetX, // убеждаемся, что самолет точно в центре
        y: targetY,
        rotation: 0,
        angle: 0,
        velocityX: baseSpeedX,
        velocityY: 0
      })
      onComplete()
    }
  }
  
  // Запускаем анимацию
  animationFrameId = requestAnimationFrame(animate)
  
  // Возвращаем функцию отмены
  return () => {
    cancelAnimationFrame(animationFrameId)
  }
}

