import { type Bonus } from '../types/types'

interface SpawnArea {
  minX: number // минимальная X позиция (в пикселях или процентах)
  maxX: number // максимальная X позиция
  minY: number // минимальная Y позиция
  maxY: number // максимальная Y позиция
}

interface GenerateBonusParams {
  existingBonuses?: Bonus[] // существующие бонусы для проверки расстояния
  containerWidth: number // ширина контейнера в пикселях
  containerHeight: number // высота контейнера в пикселях
  gameTime?: number // время игры в миллисекундах (для увеличения шанса больших иксов в начале)
  totalDuration?: number // общая длительность игры
}

/**
 * Генерирует случайный бонус с правильным распределением типов
 */
export const generateBonus = (params: GenerateBonusParams): Bonus => {
  const {
    existingBonuses = [],
    containerWidth,
    containerHeight,
    gameTime = 0,
    totalDuration = 10000
  } = params

  // Определяем тип бонуса на основе распределения
  const random = Math.random()
  let bonusType: 'multiplier' | 'additive'
  let bonusValue: number

  // Увеличиваем шанс больших иксов в начале игры
  const gameProgress = totalDuration > 0 ? gameTime / totalDuration : 0
  const bigMultiplierChance = gameProgress < 0.3 ? 0.3 : 0.1 // 30% в начале, 10% потом

  if (random < bigMultiplierChance) {
    // Большие иксы (10-15%): x2, x3, x5, x10, x20
    bonusType = 'multiplier'
    const bigMultipliers = [2, 3, 5, 10, 20]
    // Более высокие значения реже
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05] // веса для каждого множителя
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < bigMultipliers.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) {
        bonusValue = bigMultipliers[i]
        break
      }
    }
    bonusValue = bonusValue || bigMultipliers[0]
  } else if (random < 0.6 + bigMultiplierChance) {
    // Обычные бонусы-множители (60%): x2, x3, x5 (более частые)
    bonusType = 'multiplier'
    const multipliers = [2, 3, 5]
    bonusValue = multipliers[Math.floor(Math.random() * multipliers.length)]
  } else {
    // Аддитивные бонусы (25-30%): +5, +10, +20, +50, +100, +500
    bonusType = 'additive'
    const additiveValues = [5, 10, 20, 50, 100, 500]
    // Меньшие значения чаще
    const weights = [0.3, 0.25, 0.2, 0.15, 0.08, 0.02]
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < additiveValues.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) {
        bonusValue = additiveValues[i]
        break
      }
    }
    bonusValue = bonusValue || additiveValues[0]
  }

  // Генерируем позицию с проверкой минимального расстояния
  let attempts = 0
  let x: number
  let y: number
  const minDistance = 80 + Math.random() * 20 // 80-100px

  do {
    // X: от 20% до 90% ширины экрана
    const xPercent = 20 + Math.random() * 70
    x = (containerWidth * xPercent) / 100

    // Y: от 10% до 45% высоты (только в небе)
    const yPercent = 10 + Math.random() * 35
    y = (containerHeight * yPercent) / 100

    attempts++
    if (attempts > 50) break // защита от бесконечного цикла
  } while (
    existingBonuses.some((bonus) => {
      const dx = bonus.x - x
      const dy = bonus.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < minDistance
    })
  )

  // Создаем уникальный ID
  const id = `bonus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return {
    id,
    type: bonusType,
    value: bonusValue,
    x,
    y,
    isCollected: false
  }
}

/**
 * Генерирует интервал до следующего спавна бонуса
 */
export const getNextBonusSpawnDelay = (isFirst: boolean): number => {
  if (isFirst) {
    // Первый спавн: через 0.2-0.4 секунды после старта (еще быстрее)
    return 200 + Math.random() * 200
  } else {
    // Последующие: каждые 0.15-0.6 секунды (еще чаще)
    return 150 + Math.random() * 450
  }
}

/**
 * Генерирует торпеду с визуальным предупреждением
 */
export const generateTorpedo = (params: {
  existingTorpedoes?: Array<{ x: number; y: number }>
  containerWidth: number
  containerHeight: number
}): { id: string; x: number; y: number; isHit: boolean; isWarning: boolean } => {
  const { existingTorpedoes = [], containerWidth, containerHeight } = params

  // Генерируем позицию
  let attempts = 0
  let x: number
  let y: number
  const minDistance = 100 // минимальное расстояние между торпедами

  do {
    // X: от 20% до 90% ширины экрана
    const xPercent = 20 + Math.random() * 70
    x = (containerWidth * xPercent) / 100

    // Y: от 10% до 45% высоты (в небе, где летит самолет)
    const yPercent = 10 + Math.random() * 35
    y = (containerHeight * yPercent) / 100

    attempts++
    if (attempts > 50) break
  } while (
    existingTorpedoes.some((torpedo) => {
      const dx = torpedo.x - x
      const dy = torpedo.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < minDistance
    })
  )

  const id = `torpedo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return {
    id,
    x,
    y,
    isHit: false,
    isWarning: true // начинаем с предупреждения
  }
}

/**
 * Генерирует интервал до следующего спавна торпеды
 */
export const getNextTorpedoSpawnDelay = (): number => {
  // Торпеды спавнятся еще чаще: каждые 0.3-1 секунды
  return 300 + Math.random() * 700
}

