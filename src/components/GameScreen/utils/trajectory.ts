interface TrajectoryParams {
  amplitude: number // амплитуда волн
  frequency: number // частота колебаний
  duration: number // длительность полета в миллисекундах
  startAngle: number // начальный угол в радианах
  startX: number // начальная позиция X
  startY: number // начальная позиция Y
  speed: number // скорость движения в пикселях в секунду
}

interface TrajectoryPoint {
  x: number
  y: number
  angle: number // угол наклона траектории в радианах
  time: number // время от начала в миллисекундах
}

/**
 * Генерирует синусоидальную траекторию полета самолета
 */
export const generateTrajectory = (params: TrajectoryParams): TrajectoryPoint[] => {
  const { amplitude, frequency, duration, startAngle, startX, startY, speed } = params
  
  const points: TrajectoryPoint[] = []
  const timeStep = 16 // примерно 60 FPS (16ms на кадр)
  const totalSteps = Math.ceil(duration / timeStep)
  
  // Фаза для сдвига синусоиды (опционально, можно сделать случайной)
  const phase = 0
  
  for (let i = 0; i <= totalSteps; i++) {
    const time = i * timeStep
    const progress = time / duration
    
    // Вычисляем текущую позицию X (движение вправо)
    const x = startX + (speed * time) / 1000
    
    // Вычисляем позицию Y по синусоиде
    // frequency * x создает волны, phase - сдвиг фазы
    const y = startY + amplitude * Math.sin(frequency * (x - startX) / 100 + phase)
    
    // Вычисляем производную для определения угла наклона
    // dy/dx = amplitude * frequency * cos(frequency * (x - startX) / 100 + phase) / 100
    const dx = speed / 1000 // изменение X за кадр
    const dy = amplitude * frequency * Math.cos(frequency * (x - startX) / 100 + phase) / 100
    
    // Угол наклона траектории через atan2
    const angle = Math.atan2(dy, dx)
    
    points.push({
      x,
      y,
      angle,
      time
    })
  }
  
  return points
}

/**
 * Генерирует параболическую траекторию (альтернативный вариант)
 */
export const generateParabolicTrajectory = (params: TrajectoryParams): TrajectoryPoint[] => {
  const { amplitude, frequency, duration, startAngle, startX, startY, speed } = params
  
  const points: TrajectoryPoint[] = []
  const timeStep = 16
  const totalSteps = Math.ceil(duration / timeStep)
  
  for (let i = 0; i <= totalSteps; i++) {
    const time = i * timeStep
    const progress = time / duration
    
    // Параболическая траектория: y = ax^2 + bx + c
    const x = startX + (speed * time) / 1000
    const normalizedX = (x - startX) / 100 // нормализация для удобства
    
    // Парабола с вершиной в середине пути
    const a = -amplitude / (duration / 1000) // коэффициент для параболы
    const y = startY + a * normalizedX * normalizedX + amplitude * normalizedX
    
    // Производная для угла: dy/dx = 2ax + b
    const dy = 2 * a * normalizedX + amplitude
    const dx = 1
    
    const angle = Math.atan2(dy, dx)
    
    points.push({
      x,
      y,
      angle,
      time
    })
  }
  
  return points
}

/**
 * Генерирует случайную траекторию (синусоида или парабола)
 */
export const generateRandomTrajectory = (params: TrajectoryParams): TrajectoryPoint[] => {
  const useSinusoid = Math.random() > 0.5
  
  if (useSinusoid) {
    return generateTrajectory(params)
  } else {
    return generateParabolicTrajectory(params)
  }
}

