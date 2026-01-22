import s from './GameScreen.module.css'
import Bonus from './Bonus/Bonus'
import Torpedo from './Torpedo/Torpedo'
import CloudsLayer from './CloudsLayer/CloudsLayer'
import Airplane from './Airplane/Airplane'
import UILayer from './UILayer/UILayer'
import Explosion from './Explosion/Explosion'
import BonusParticles from './BonusParticles/BonusParticles'
import { 
  type Bonus as BonusType, 
  type Torpedo as TorpedoType,
  type GameState,
  type Airplane as AirplaneType,
  type Explosion as ExplosionType,
  type Ship as ShipType
} from './types/types'
import { useState, useEffect, useRef } from 'react'
import { animateTakeoff } from './utils/airplaneAnimation'
import { generateBonus, generateTorpedo } from './utils/spawnSystem'
import { checkCollision } from './utils/collisionDetection'

const GameScreen = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    currentBalance: 1000, // начальная ставка
    speed: 'normal',
    isDemo: false,
    gameStarted: false,
    gameEnded: false,
    animationSpeed: 60 // fps для normal, 120 для fast
  })
  
  const [airplane, setAirplane] = useState<AirplaneType>({
    x: 60, // позиция на корабле
    y: 41, // позиция на корабле (%)
    rotation: 0,
    speed: 0,
    isFlying: false,
    isLanding: false,
    angle: 0,
    velocityX: 0,
    velocityY: 0,
    startX: 60,
    startY: 45
  })
  
  const [activeBonuses, setActiveBonuses] = useState<BonusType[]>([])
  const [activeTorpedoes, setActiveTorpedoes] = useState<TorpedoType[]>([])
  const [activeExplosions, setActiveExplosions] = useState<ExplosionType[]>([])
  
  // Состояние для партиклов бонусов
  const [bonusParticles, setBonusParticles] = useState<Array<{
    id: string
    x: number
    y: number
    value: number
    type: 'multiplier' | 'additive'
  }>>([])
  
  // Состояние для анимации падения/разбития самолета
  const [airplaneCrash, setAirplaneCrash] = useState(false)
  
  // Состояние для приземления на корабль
  const [airplaneLanded, setAirplaneLanded] = useState(false)
  
  // Состояние для визуального эффекта столкновения
  const [collisionEffect, setCollisionEffect] = useState<'bonus' | 'torpedo' | null>(null)
  
  // Состояние для временного эффекта гравитации (от столкновений)
  const gravityMultiplierRef = useRef(1.0) // Множитель гравитации (1.0 = нормальная, >1.0 = быстрее падение, <1.0 = медленнее)
  const gravityEffectEndTimeRef = useRef<number | null>(null) // Время окончания эффекта гравитации
  
  // Ref для отслеживания времени последнего столкновения (чтобы не выравнивать угол сразу после столкновения)
  const lastCollisionTimeRef = useRef<number | null>(null)
  
  // Ref для целевого угла после столкновения (для плавного выравнивания)
  const targetAngleAfterCollisionRef = useRef<number | null>(null)
  
  // Ref для подъемной силы от бонуса (чтобы самолет действительно поднимался вверх)
  const bonusLiftForceRef = useRef(0) // Подъемная сила в пикселях в секунду
  const bonusLiftEndTimeRef = useRef<number | null>(null) // Время окончания подъемной силы
  
  // Состояние для тряски самолета
  const airplaneShakeRef = useRef({ x: 0, y: 0 })
  
  // Смещение камеры (для эффекта движения)
  const [cameraOffset, setCameraOffset] = useState(0)
  const cameraOffsetRef = useRef(0) // Ref для получения актуального значения в спавне
  
  // Ширина изображения неба (будет загружена динамически)
  const [skyImageWidth, setSkyImageWidth] = useState(1920) // Предполагаемая ширина, будет обновлена после загрузки
  
  // Ref для хранения функции отмены анимации
  const takeoffCancelRef = useRef<(() => void) | null>(null)
  
  // Состояние для отслеживания времени полета (не используется, но оставляем для совместимости)
  const flightStartTimeRef = useRef<number | null>(null)
  const shakeTimeoutRef = useRef<number | null>(null)
  
  // Ref для хранения функции перезапуска игры (для автоматического перезапуска)
  const handleStartGameRef = useRef<(() => void) | null>(null)
  
  // Начальная ставка
  const initialBet = 1000
  
  // Ref для хранения актуальных значений для проверки коллизий
  const airplaneRef = useRef(airplane)
  const gameStateRef = useRef(gameState)
  const airplaneCrashRef = useRef(airplaneCrash)
  const airplaneLandedRef = useRef(airplaneLanded)
  
  // Обновляем ref при изменении состояния
  useEffect(() => {
    airplaneRef.current = airplane
  }, [airplane])
  
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])
  
  useEffect(() => {
    airplaneCrashRef.current = airplaneCrash
    airplaneLandedRef.current = airplaneLanded
  }, [airplaneCrash, airplaneLanded])
  
  // Сброс в режим «ожидание»: самолёт на корабле, кнопка Play активна (без автозапуска взлёта)
  const resetToPlayMode = () => {
    setGameState(prev => ({
      ...prev,
      currentBalance: initialBet,
      gameStarted: false,
      gameEnded: false,
      isPlaying: false
    }))

    const startX = 60
    const startY = 41
    setAirplane({
      x: startX,
      y: startY,
      rotation: 0,
      speed: 0,
      isFlying: false,
      isLanding: false,
      angle: 0,
      velocityX: 0,
      velocityY: 0,
      startX: startX,
      startY: startY
    })

    setCameraOffset(0)
    cameraOffsetRef.current = 0
    flightStartTimeRef.current = null
    setAirplaneCrash(false)
    setAirplaneLanded(false)
    setCollisionEffect(null)
    gravityMultiplierRef.current = 1.0
    gravityEffectEndTimeRef.current = null
    lastCollisionTimeRef.current = null
    targetAngleAfterCollisionRef.current = null
    bonusLiftForceRef.current = 0
    bonusLiftEndTimeRef.current = null
    setActiveBonuses([])
    setActiveTorpedoes([])
    setActiveExplosions([])
  }

  // Через 2 секунды после приземления на корабль — переход в режим ожидания (кнопка Play активна)
  useEffect(() => {
    if (!airplaneLanded) return

    const timer = window.setTimeout(() => {
      resetToPlayMode()
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [airplaneLanded])
  
  // Функция применения эффекта столкновения
  const applyCollisionEffect = (type: 'bonus' | 'torpedo') => {
    // Записываем время столкновения
    const currentTime = performance.now()
    lastCollisionTimeRef.current = currentTime
    
    if (type === 'torpedo') {
      // Попадание в торпеду - нос опускается вниз, потом стабилизируется (умеренный отскок)
      const angleChangeDegrees = -(7 + Math.random() * 3) // 7-10° снижение носа вниз (чуть меньше)
      const angleChangeRadians = (angleChangeDegrees * Math.PI) / 180
      
      setAirplane(prev => {
        // Уменьшаем угол (отрицательный angle = опускание носа вниз)
        const newAngle = prev.angle + angleChangeRadians
        
        return {
          ...prev,
          angle: newAngle,
          // velocityY положительное = движение ВНИЗ (увеличение Y) - умеренный отскок
          velocityY: Math.max(prev.velocityY, prev.velocityY + 2) // Уменьшено с 3 до 2
        }
      })
      
      // Устанавливаем целевой угол для стабилизации (к 0°)
      targetAngleAfterCollisionRef.current = 0
      
      // Визуальный эффект столкновения (красная вспышка)
      setCollisionEffect('torpedo')
      setTimeout(() => setCollisionEffect(null), 300)
      
      // Гравитация увеличена = самолет падает быстрее (как будто убавили топливо) - умеренный эффект
      gravityMultiplierRef.current = 1.05 // Уменьшено с 1.08 до 1.05
      gravityEffectEndTimeRef.current = currentTime + 700 // Уменьшено с 800 до 700ms
      
      // Тряска самолета (более плавная и менее заметная)
      const shakeDuration = 200 // Уменьшена длительность
      const shakeIntensity = 2 // Уменьшена интенсивность (было 5)
      let shakeTime = 0
      
      // Очищаем предыдущую тряску если она была
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current)
        shakeTimeoutRef.current = null
      }
      
      const shake = () => {
        shakeTime += 16
        if (shakeTime < shakeDuration) {
          // Более плавная тряска с затуханием
          const progress = shakeTime / shakeDuration
          const fadeOut = 1 - progress // Затухание к концу
          airplaneShakeRef.current = {
            x: (Math.random() - 0.5) * shakeIntensity * fadeOut,
            y: (Math.random() - 0.5) * shakeIntensity * fadeOut
          }
          shakeTimeoutRef.current = window.setTimeout(shake, 16) as unknown as number
        } else {
          airplaneShakeRef.current = { x: 0, y: 0 }
          shakeTimeoutRef.current = null
        }
      }
      shake()
    } else {
      // БОНУС - нос поднимается вверх, потом стабилизируется (меньший отскок)
      const angleChangeDegrees = 4 + Math.random() * 2 // 4-6° подъем носа вверх (меньше)
      const angleChangeRadians = (angleChangeDegrees * Math.PI) / 180
      
      setAirplane(prev => {
        // Увеличиваем угол (положительный angle = подъем носа вверх)
        const newAngle = prev.angle + angleChangeRadians
        
        return {
          ...prev,
          angle: newAngle,
          // velocityY отрицательное = движение ВВЕРХ (уменьшение Y) - меньший отскок
          velocityY: Math.min(prev.velocityY, prev.velocityY - 1) // Уменьшено с -2 до -1
        }
      })
      
      // Устанавливаем целевой угол для стабилизации (к 0°)
      targetAngleAfterCollisionRef.current = 0
      
      // Визуальный эффект столкновения (золотая/зеленая вспышка)
      setCollisionEffect('bonus')
      setTimeout(() => setCollisionEffect(null), 300)
      
      // Подъемная сила отрицательная = ускорение ВВЕРХ (как будто добавили топливо) - меньше
      bonusLiftForceRef.current = -1 // Уменьшено для меньшего эффекта топлива
      bonusLiftEndTimeRef.current = currentTime + 250 // Уменьшено время действия
      // Гравитация уменьшена = самолет падает медленнее (как будто добавили топливо) - меньше эффект
      gravityMultiplierRef.current = 0.96 // Уменьшено с 0.92 до 0.96 (еще меньше эффект)
      gravityEffectEndTimeRef.current = currentTime + 700 // Уменьшено с 900 до 700ms
    }
  }
  
  // Функция обработки столкновений (используем useRef для стабильной ссылки)
  const handleCollisionRef = useRef((type: 'bonus' | 'torpedo', item: BonusType | TorpedoType, collisionX?: number, collisionY?: number) => {
    if (type === 'bonus') {
      const bonus = item as BonusType
      if (bonus.type === 'multiplier') {
        setGameState(prev => ({
          ...prev,
          currentBalance: prev.currentBalance * bonus.value
        }))
      } else {
        setGameState(prev => ({
          ...prev,
          currentBalance: prev.currentBalance + bonus.value
        }))
      }
      setActiveBonuses(prev => prev.filter(b => b.id !== bonus.id))
      applyCollisionEffect('bonus')
      
      // Добавляем партиклы при сборе бонуса
      if (collisionX !== undefined && collisionY !== undefined) {
        const particleId = `bonus-particle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setBonusParticles(prev => [...prev, {
          id: particleId,
          x: collisionX,
          y: collisionY,
          value: bonus.value,
          type: bonus.type
        }])
        
        // Удаляем партиклы через 800ms
        setTimeout(() => {
          setBonusParticles(prev => prev.filter(p => p.id !== particleId))
        }, 800)
      }
    } else {
      const torpedo = item as TorpedoType
      setGameState(prev => ({
        ...prev,
        currentBalance: Math.floor(prev.currentBalance / 2)
      }))
      setActiveTorpedoes(prev => prev.filter(t => t.id !== torpedo.id))
      applyCollisionEffect('torpedo')
      
      // Создаем взрыв в позиции столкновения
      if (collisionX !== undefined && collisionY !== undefined) {
        const explosionId = `explosion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setActiveExplosions(prev => [...prev, {
          id: explosionId,
          x: collisionX,
          y: collisionY
        }])
      }
    }
  })
  
  // Функция обработки старта игры
  const handleStartGame = () => {
    // Если игра уже закончилась, сбрасываем все состояния для новой игры
    if (gameState.gameEnded) {
      // Останавливаем все анимации и таймеры
      if (takeoffCancelRef.current) {
        takeoffCancelRef.current()
      }
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current)
      }
    }
    
    // Сбросить баланс на начальную ставку
    setGameState(prev => ({
      ...prev,
      currentBalance: initialBet,
      gameStarted: true,
      gameEnded: false,
      isPlaying: true
    }))
    
    // Установить самолет в стартовую позицию
    const startX = 60
    const startY = 41
    setAirplane({
      x: startX,
      y: startY,
      rotation: 0,
      speed: 0,
      isFlying: false, // Пока не взлетел
      isLanding: false,
      angle: 0,
      velocityX: 0,
      velocityY: 0,
      startX: startX,
      startY: startY
    })
    
    // Сбросить смещение камеры
    setCameraOffset(0)
    cameraOffsetRef.current = 0
    
    // Сбросить время начала полета
    flightStartTimeRef.current = null
    
    // Сбросить состояние разбития и приземления
    setAirplaneCrash(false)
    setAirplaneLanded(false)
    
    // Сбросить эффект столкновения
    setCollisionEffect(null)
    
    // Сбросить эффекты гравитации
    gravityMultiplierRef.current = 1.0
    gravityEffectEndTimeRef.current = null
    lastCollisionTimeRef.current = null
    targetAngleAfterCollisionRef.current = null
    bonusLiftForceRef.current = 0
    bonusLiftEndTimeRef.current = null
    
    // Очистить предыдущие бонусы, торпеды и взрывы
    setActiveBonuses([])
    setActiveTorpedoes([])
    setActiveExplosions([])
    
    // Запустить анимацию взлета
    const cancelTakeoff = animateTakeoff({
      startX: startX,
      startY: startY,
      speed: gameState.speed,
      onUpdate: (updates) => {
        setAirplane(prev => ({
          ...prev,
          ...updates,
          isFlying: true
        }))
      },
      onComplete: () => {
        // Взлет завершен, самолет уже в правильной позиции из анимации
        // Записываем время начала полета
        flightStartTimeRef.current = performance.now()
        setAirplane(prev => ({
          ...prev,
          isFlying: true
        }))
      }
    })
    
    // Сохранить функцию отмены
    takeoffCancelRef.current = cancelTakeoff
    
    // Сохраняем функцию в ref для использования в setTimeout
    handleStartGameRef.current = handleStartGame
  }
  
  // Система спавна бонусов и торпед (на основе таймеров)
  const containerRef = useRef<HTMLDivElement>(null)
  const bonusSpawnIntervalRef = useRef<number | null>(null)
  const torpedoSpawnIntervalRef = useRef<number | null>(null)
  
  useEffect(() => {
    // Очищаем предыдущие таймеры
    if (bonusSpawnIntervalRef.current !== null) {
      clearInterval(bonusSpawnIntervalRef.current)
      bonusSpawnIntervalRef.current = null
    }
    if (torpedoSpawnIntervalRef.current !== null) {
      clearInterval(torpedoSpawnIntervalRef.current)
      torpedoSpawnIntervalRef.current = null
    }
    
    // Спавн продолжается на протяжении всего полета, пока самолет не разбился или не приземлился
    if (!gameState.gameStarted || !airplane.isFlying || airplaneCrash || airplaneLanded) return
    
    // Функция спавна бонусов
    const spawnBonus = () => {
      // Проверяем актуальные значения через ref
      if (!containerRef.current || airplaneCrashRef.current || airplaneLandedRef.current || !gameStateRef.current.gameStarted || !airplaneRef.current.isFlying) {
        return
      }
      
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      const currentCameraOffset = cameraOffsetRef.current
      
      // Спавн бонуса (75% шанс - больше бонусов)
      if (Math.random() < 0.75) {
        const spawnX = containerWidth + currentCameraOffset + 100 + Math.random() * 200
        const spawnY = (containerHeight * 0.1) + Math.random() * (containerHeight * 0.25)
        
        // Получаем текущие бонусы из состояния через функцию обновления
        setActiveBonuses(prevBonuses => {
          const bonus = generateBonus({
            existingBonuses: prevBonuses,
            containerWidth: containerWidth * 3,
            containerHeight,
            gameTime: 0,
            totalDuration: gameStateRef.current.speed === 'normal' ? 15000 : 7500
          })
          
          return [...prevBonuses, { 
            ...bonus, 
            x: spawnX,
            y: spawnY 
          }]
        })
      }
    }
    
    // Функция спавна торпед
    const spawnTorpedo = () => {
      // Проверяем актуальные значения через ref
      if (!containerRef.current || airplaneCrashRef.current || airplaneLandedRef.current || !gameStateRef.current.gameStarted || !airplaneRef.current.isFlying) {
        return
      }
      
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      const currentCameraOffset = cameraOffsetRef.current
      
      // Спавн торпеды (85% шанс - больше торпед)
      if (Math.random() < 0.85) {
        const spawnX = containerWidth + currentCameraOffset + 100 + Math.random() * 200
        const spawnY = (containerHeight * 0.1) + Math.random() * (containerHeight * 0.2)
        
        setActiveTorpedoes(prevTorpedoes => {
          const torpedo = generateTorpedo({
            existingTorpedoes: prevTorpedoes,
            containerWidth: containerWidth * 3,
            containerHeight
          })
          
          const newTorpedo = { 
            ...torpedo, 
            x: spawnX,
            y: spawnY
          }
          
          // Через 500ms убираем предупреждение
          setTimeout(() => {
            setActiveTorpedoes(prev =>
              prev.map(t => t.id === newTorpedo.id ? { ...t, isWarning: false } : t)
            )
          }, 500)
          
          return [...prevTorpedoes, newTorpedo]
        })
      }
    }
    
    // Запускаем интервалы для спавна с фиксированными интервалами
    // Бонусы: каждые 0.4 секунды (75% шанс = ~1.875 бонусов/сек - больше бонусов)
    bonusSpawnIntervalRef.current = window.setInterval(spawnBonus, 400) as unknown as number
    
    // Торпеды: каждые 0.4 секунды (85% шанс = ~2.125 торпед/сек - больше торпед)
    torpedoSpawnIntervalRef.current = window.setInterval(spawnTorpedo, 400) as unknown as number
    
    return () => {
      if (bonusSpawnIntervalRef.current !== null) {
        clearInterval(bonusSpawnIntervalRef.current)
        bonusSpawnIntervalRef.current = null
      }
      if (torpedoSpawnIntervalRef.current !== null) {
        clearInterval(torpedoSpawnIntervalRef.current)
        torpedoSpawnIntervalRef.current = null
      }
    }
  }, [gameState.gameStarted, airplane.isFlying, airplaneCrash, airplaneLanded, gameState.speed])
  
  // Система спавна кораблей каждые 200px от первого
  const [activeShips, setActiveShips] = useState<ShipType[]>([])
  
  useEffect(() => {
    // Очищаем корабли только если игра не началась, самолет не летит, или произошло разбитие
    // НЕ очищаем при приземлении, чтобы корабль оставался видимым
    if (!gameState.gameStarted || !airplane.isFlying || airplaneCrash) {
      // Используем setTimeout для асинхронной очистки
      const timer = setTimeout(() => {
        setActiveShips([])
      }, 0)
      return () => clearTimeout(timer)
    }
    
    // Первый корабль на позиции 100px, следующие каждые 500px
    const firstShipX = 100
    const shipSpacing = 500
    
    // Вычисляем, сколько кораблей должно быть видно впереди
    const containerWidth = containerRef.current?.offsetWidth || 480
    const maxVisibleDistance = cameraOffset + containerWidth + 1000 // +1000 для предзагрузки
    
    // Генерируем корабли (начиная со второго, так как первый уже есть)
    const ships: ShipType[] = []
    let shipX = firstShipX + shipSpacing // Пропускаем первый корабль (100px)
    
    // Добавляем корабли до максимальной видимой дистанции
    while (shipX <= maxVisibleDistance) {
      ships.push({
        id: `ship-${shipX}`,
        x: shipX
      })
      shipX += shipSpacing
    }
    
    // Используем setTimeout для асинхронного обновления
    const timer = setTimeout(() => {
      setActiveShips(ships)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [gameState.gameStarted, airplane.isFlying, airplaneCrash, cameraOffset])
  
  // Игровой цикл - движение камеры (фон движется влево, самолет остается в центре)
  useEffect(() => {
    if (!airplane.isFlying || !gameState.gameStarted || gameState.gameEnded) return
    
    let animationFrameId: number
    let lastTime = performance.now()
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      
      // Скорость движения камеры (фон движется влево)
      const speedX = gameState.speed === 'normal' ? 150 : 250 // пикселей в секунду
      const deltaX = (speedX * deltaTime) / 1000 // конвертация в пиксели за кадр
      
      // Двигаем камеру (увеличиваем смещение) только если самолет не приземлился и не разбился
      if (!airplaneLandedRef.current && !airplaneCrashRef.current) {
        setCameraOffset(prev => {
          const newOffset = prev + deltaX
          cameraOffsetRef.current = newOffset // Обновляем ref
          return newOffset
        })
      }
      
      // Проверяем время полета (для отслеживания начала полета)
      const flightStartTime = flightStartTimeRef.current
      if (flightStartTime === null) {
        animationFrameId = requestAnimationFrame(gameLoop)
        return
      }
      
      // Движение самолета только по Y (вертикально) и обновление угла
      setAirplane(prev => {
        let newVelocityY = prev.velocityY
        let newAngle = prev.angle
        
        // Проверяем, не началась ли уже анимация разбития
        if (airplaneCrash) {
          return prev
        }
        
        // Базовая гравитация: самолет быстро опускается вниз (уменьшено время свободного полета)
        const baseGravity = 1.8 // пикселей в секунду^2 (увеличено для более быстрого падения)
        
        // Применяем временный эффект гравитации от столкновений
        let gravityMultiplier = 1.0
        
        if (gravityEffectEndTimeRef.current && currentTime < gravityEffectEndTimeRef.current) {
          // Эффект еще активен
          gravityMultiplier = gravityMultiplierRef.current
        } else {
          // Эффект закончился, возвращаем к нормальной гравитации
          gravityMultiplier = 1.0
          gravityMultiplierRef.current = 1.0
          gravityEffectEndTimeRef.current = null
        }
        
        const gravity = baseGravity * gravityMultiplier
        
        // Применяем подъемную силу от бонуса (если активна)
        let liftForce = 0
        if (bonusLiftEndTimeRef.current && currentTime < bonusLiftEndTimeRef.current) {
          liftForce = bonusLiftForceRef.current
        } else {
          // Подъемная сила закончилась
          bonusLiftForceRef.current = 0
          bonusLiftEndTimeRef.current = null
        }
        
        // Применяем гравитацию и подъемную силу
        // Обе силы - это ускорения (пиксели/сек^2), умножаем на deltaTime/1000 для получения изменения скорости
        const gravityAcceleration = (gravity * deltaTime) / 1000
        const liftAcceleration = (liftForce * deltaTime) / 1000
        newVelocityY = prev.velocityY + gravityAcceleration + liftAcceleration
        
        // Плавное выравнивание угла после столкновений (стабилизация к 0°)
        // Приоритет: сначала стабилизация после столкновения, потом автоматическое опускание
        if (targetAngleAfterCollisionRef.current !== null) {
          // Стабилизация после столкновения - плавно возвращаем нос к 0°
          const targetAngle = targetAngleAfterCollisionRef.current // всегда 0° после столкновения
          const angleDifference = targetAngle - prev.angle
          
          // Определяем, это бонус или торпеда (для разной скорости стабилизации)
          const isBonusEffect = gravityMultiplierRef.current < 1.0
          // Скорость стабилизации (плавная и надежная)
          const angleRecoverySpeed = isBonusEffect 
            ? 4 * Math.PI / 180 // 4° в секунду для бонуса
            : 3.5 * Math.PI / 180 // 3.5° в секунду для торпеды
          
          if (Math.abs(angleDifference) > 0.001) {
            // Плавно стабилизируем угол к целевому (0°)
            const angleRecovery = Math.sign(angleDifference) * Math.min(
              Math.abs(angleDifference),
              angleRecoverySpeed * (deltaTime / 1000)
            )
            newAngle = prev.angle + angleRecovery
          } else {
            // Угол уже стабилизирован к 0°
            newAngle = targetAngle
            targetAngleAfterCollisionRef.current = null // Сбрасываем, стабилизация завершена
          }
        } else {
          // Автоматическое опускание носа, если самолет ниже центра неба (только если нет активной стабилизации)
          // Небо занимает 50% высоты (от 0% до 50%), центр неба = 25% от верха
          const skyCenterY = 25
          if (prev.y > skyCenterY) {
            // Самолет ниже центра неба - автоматически опускаем нос вниз
            // Отрицательный angle = нос вниз (после инверсии в rotation)
            const targetAngleDown = -(15 * Math.PI / 180) // -15° (нос вниз)
            const angleDifference = targetAngleDown - prev.angle
            const autoAngleSpeed = 2 * Math.PI / 180 // 2° в секунду для автоматического опускания
            
            if (Math.abs(angleDifference) > 0.001) {
              const angleChange = Math.sign(angleDifference) * Math.min(
                Math.abs(angleDifference),
                autoAngleSpeed * (deltaTime / 1000)
              )
              newAngle = prev.angle + angleChange
            } else {
              newAngle = targetAngleDown
            }
          }
          // Если самолет выше центра и нет активной стабилизации, угол остается как есть
        }
        
        // Ограничиваем угол наклона (не более 45° вниз и 30° вверх)
        newAngle = Math.max(-30 * Math.PI / 180, Math.min(45 * Math.PI / 180, newAngle))
        
        // Если самолет уже приземлился, не обновляем его позицию
        // Используем ref для синхронизации
        if (airplaneLandedRef.current) {
          return prev
        }
        
        // Изменение Y на основе угла и velocityY
        const deltaY = (newVelocityY * deltaTime) / 1000
        let newY = prev.y + deltaY
        
        // ============================================
        // ПРОВЕРКА КОЛЛИЗИЙ С КОРАБЛЯМИ И МОРЕМ (ВНУТРИ setAirplane - используем newY!)
        // ============================================
        const containerWidth = containerRef.current?.offsetWidth || 480
        const containerHeight = containerRef.current?.offsetHeight || 854
        const currentCameraOffset = cameraOffsetRef.current
        const airplaneWorldX = currentCameraOffset + (containerWidth * 0.5)
        
        // ПРОВЕРКА 1: Касание моря (самолет ниже 50%)
        if (newY > 50) {
          setAirplaneCrash(true)
          setTimeout(() => {
            setGameState(prevState => ({
              ...prevState,
              currentBalance: initialBet,
              gameStarted: false,
              gameEnded: false,
              isPlaying: false
            }))
            
            const startX = 60
            const startY = 41
            setAirplane({
              x: startX,
              y: startY,
              rotation: 0,
              speed: 0,
              isFlying: false,
              isLanding: false,
              angle: 0,
              velocityX: 0,
              velocityY: 0,
              startX: startX,
              startY: startY
            })
            
            setCameraOffset(0)
            cameraOffsetRef.current = 0
            flightStartTimeRef.current = null
            setAirplaneCrash(false)
            setAirplaneLanded(false)
            setCollisionEffect(null)
            gravityMultiplierRef.current = 1.0
            gravityEffectEndTimeRef.current = null
            lastCollisionTimeRef.current = null
            targetAngleAfterCollisionRef.current = null
            bonusLiftForceRef.current = 0
            bonusLiftEndTimeRef.current = null
            setActiveBonuses([])
            setActiveTorpedoes([])
            setActiveExplosions([])
          }, 1000)
        }
        
        // ПРОВЕРКА 2: Приземление на корабль (только если падает вниз)
        if (!airplaneCrash && newVelocityY > 0.1) {
          const airplaneHalfHeightPx = 44 // половина высоты самолета (88px / 2)
          const airplaneHalfHeightPercent = (airplaneHalfHeightPx / containerHeight * 100)
          const airplaneBottomYPercent = newY + airplaneHalfHeightPercent
          
          const shipTopYPercent = 32.5
          const shipHeightPercent = (188 / containerHeight * 100)
          const shipBottomYPercent = shipTopYPercent + shipHeightPercent
          
          // Все корабли
          const allShips: ShipType[] = [
            { id: 'ship-start', x: 100 },
            ...activeShips
          ]
          
          for (const ship of allShips) {
            const shipHalfWidth = 94
            const shipLeftX = ship.x - shipHalfWidth - 30 // увеличенный запас
            const shipRightX = ship.x + shipHalfWidth + 30 // увеличенный запас
            
            const isOverShipX = airplaneWorldX >= shipLeftX && airplaneWorldX <= shipRightX
            // Проверка Y: самолет должен быть достаточно низко, чтобы визуально касаться корабля
            // Проверяем, что ЦЕНТР самолета уже ниже верха корабля (а не только низ)
            // Это гарантирует, что самолет действительно опустился на корабль
            const minCenterOffset = 8 // центр самолета должен быть минимум на 8% ниже верха корабля
            const isInShipZoneY = newY >= shipTopYPercent + minCenterOffset && 
                                  airplaneBottomYPercent <= shipBottomYPercent + 5 // допуск только снизу
            
            // ЛОГИ (только если близко к кораблю)
            if (isOverShipX && newY >= 25 && newY <= 50) {
              console.log('🔍 Landing Check:', {
                airplaneY: newY.toFixed(2) + '%',
                airplaneBottomY: airplaneBottomYPercent.toFixed(2) + '%',
                shipTopY: shipTopYPercent + '%',
                shipBottomY: shipBottomYPercent.toFixed(2) + '%',
                airplaneWorldX: airplaneWorldX.toFixed(2),
                shipX: ship.x,
                shipLeftX: shipLeftX.toFixed(2),
                shipRightX: shipRightX.toFixed(2),
                isOverShipX,
                isInShipZoneY,
                velocityY: newVelocityY.toFixed(3),
                containerHeight: containerHeight
              })
            }
            
            if (isOverShipX && isInShipZoneY) {
              // ПРИЗЕМЛЕНИЕ!
              // Фиксируем самолет так, чтобы его низ визуально касался корабля
              // Добавляем большой отступ вниз (40px) для визуального контакта - самолет должен быть значительно ниже
              const visualOffsetPx = 0
              const visualOffsetPercent = (visualOffsetPx / containerHeight * 100)
              const landingY = shipTopYPercent - airplaneHalfHeightPercent + visualOffsetPercent
              
              console.log('✈️ LANDING ON SHIP!', {
                shipX: ship.x,
                airplaneY: newY.toFixed(2) + '%',
                airplaneBottomY: airplaneBottomYPercent.toFixed(2) + '%',
                targetY: landingY.toFixed(2) + '%',
                airplaneHalfHeightPercent: airplaneHalfHeightPercent.toFixed(2) + '%',
                shipTopY: shipTopYPercent + '%',
                visualOffset: visualOffsetPercent.toFixed(2) + '%'
              })
              
              setAirplaneLanded(true)
              airplaneLandedRef.current = true // Синхронизируем ref сразу
              
              // Останавливаем движение камеры
              // Камера больше не будет двигаться после приземления
              // Убеждаемся, что корабль находится в видимой области
              // Вычисляем нужное смещение камеры, чтобы корабль был в центре экрана
              // Корабль имеет left: 100px, и transform: translateX(calc(-50% + displayX))
              // translateX(-50%) сдвигает корабль на -50% от его ширины (188px / 2 = 94px)
              // Итоговая позиция центра корабля: left (100px) - 94px + displayX = 6px + displayX
              // Для центрирования: 6px + displayX = containerWidth / 2
              // displayX = ship.x - cameraOffset
              // Значит: 6px + (ship.x - cameraOffset) = containerWidth / 2
              // cameraOffset = ship.x + 6px - (containerWidth / 2)
              const containerWidth = containerRef.current?.offsetWidth || 480
              const centerX = containerWidth / 2 // центр экрана (240px)
              const shipLeft = 100 // left корабля из CSS
              const shipWidth = 188 // ширина корабля
              const shipHalfWidth = shipWidth / 2 // половина ширины (94px)
              // Смещаем корабль вправо при приземлении на 50 пикселей
              const shipXWithOffset = ship.x + 43
              // Правильная формула: cameraOffset = ship.x - (centerX - shipLeft + shipHalfWidth)
              // Это гарантирует, что центр корабля будет на centerX
              const targetCameraOffset = shipXWithOffset - (centerX - shipLeft + shipHalfWidth)
              const displayX = shipXWithOffset - targetCameraOffset
              const finalShipCenterX = shipLeft - shipHalfWidth + displayX
              
              console.log('🎯 Adjusting camera for landing:', {
                shipX: ship.x,
                containerWidth,
                centerX,
                shipLeft,
                shipHalfWidth,
                targetCameraOffset,
                currentCameraOffset: cameraOffsetRef.current,
                displayX,
                finalShipCenterX,
                shouldBeCenter: Math.abs(finalShipCenterX - centerX) < 1
              })
              
              // Обновляем камеру асинхронно после завершения setAirplane
              // Используем setTimeout для обновления в следующем тике событийного цикла
              setTimeout(() => {
                setCameraOffset(targetCameraOffset)
                cameraOffsetRef.current = targetCameraOffset
              }, 0)
              
              // Возвращаем самолет с фиксированной позицией на корабле
              return {
                ...prev,
                y: landingY,
                velocityY: 0,
                velocityX: 0,
                angle: 0,
                rotation: 0,
                isLanding: true,
                speed: 0 // Останавливаем скорость
              }
            }
          }
        }
        
        // Ограничиваем движение самолета границами неба (5% - 41% от верха) только до начала падения
        if (!airplaneCrash) {
          const minY = 5 // минимальная высота (верх неба с небольшим отступом)
          const maxY = 41 // максимальная высота (низ неба с небольшим отступом)
          const originalY = newY
          newY = Math.max(minY, Math.min(maxY, newY))
          
          // Если самолет достиг верхней границы, немного уменьшаем скорость падения
          if (newY === minY) {
            newVelocityY = Math.max(0, prev.velocityY * 0.9)
          }
          
          // Если самолет пытается выйти за нижнюю границу (originalY > maxY) - касается моря
          // Запускаем анимацию разбития
          if (originalY > maxY) {
            setAirplaneCrash(true)
            // Игра заканчивается когда анимация полностью завершена (1 секунда), затем возвращаемся в стартовую позицию
            setTimeout(() => {
              // Возвращаем игру в стартовое состояние (самолет на корабле, кнопка Play активна)
              setGameState(prevState => ({
                ...prevState,
                currentBalance: initialBet,
                gameStarted: false,
                gameEnded: false,
                isPlaying: false
              }))
              
              // Установить самолет в стартовую позицию на корабле
              const startX = 60
              const startY = 41
              setAirplane({
                x: startX,
                y: startY,
                rotation: 0,
                speed: 0,
                isFlying: false,
                isLanding: false,
                angle: 0,
                velocityX: 0,
                velocityY: 0,
                startX: startX,
                startY: startY
              })
              
              // Сбросить смещение камеры
              setCameraOffset(0)
              cameraOffsetRef.current = 0
              
              // Сбросить время начала полета
              flightStartTimeRef.current = null
              
              // Сбросить состояние разбития
              setAirplaneCrash(false)
              
              // Сбросить эффект столкновения
              setCollisionEffect(null)
              
              // Сбросить эффекты гравитации
              gravityMultiplierRef.current = 1.0
              gravityEffectEndTimeRef.current = null
              lastCollisionTimeRef.current = null
              targetAngleAfterCollisionRef.current = null
              bonusLiftForceRef.current = 0
              bonusLiftEndTimeRef.current = null
              
              // Очистить все бонусы, торпеды и взрывы
              setActiveBonuses([])
              setActiveTorpedoes([])
              setActiveExplosions([])
            }, 1000) // Время анимации исчезновения
          }
        }
        
        // Обновляем rotation на основе angle (конвертация из радиан в градусы)
        // ВАЖНО: В CSS rotate() положительный угол = поворот по часовой стрелке (нос вниз)
        // Отрицательный угол = поворот против часовой стрелки (нос вверх)
        // Поэтому инвертируем знак angle для rotation
        const newRotation = -(newAngle * 180) / Math.PI
        
        // Получаем текущие значения тряски из ref
        const currentShake = airplaneShakeRef.current
        
        // Если самолет приземлился, возвращаем его без изменений (позиция уже зафиксирована при приземлении)
        if (airplaneLandedRef.current) {
          return prev
        }
        
        // Добавляем тряску, но ограничиваем итоговую позицию границами только до начала разбития
        // Тряска применяется только если самолет не разбивается и не приземлился
        let finalY = newY
        if (!airplaneCrash && (currentShake.x !== 0 || currentShake.y !== 0)) {
          // Применяем тряску, но очень плавно
          finalY = newY + currentShake.y * 0.5 // Уменьшаем влияние тряски на 50%
          const minY = 5
          const maxY = 41
          finalY = Math.max(minY, Math.min(maxY, finalY))
        } else if (!airplaneCrash) {
          const minY = 5
          const maxY = 41
          finalY = Math.max(minY, Math.min(maxY, newY))
        }
        
        return {
          ...prev,
          // X остается фиксированным (самолет в центре экрана)
          y: finalY, // итоговая позиция с тряской, но в пределах границ
          velocityX: speedX,
          velocityY: newVelocityY,
          angle: newAngle,
          rotation: newRotation,
          isLanding: airplaneCrash || airplaneLanded
        }
      })
      
      // Получаем актуальные значения для проверки коллизий с бонусами/торпедами
      const currentAirplane = airplaneRef.current
      const currentCameraOffset = cameraOffsetRef.current
      const containerHeight = containerRef.current?.offsetHeight || 0
      
      // Позиция самолета в пикселях
      const airplanePos = {
        x: currentAirplane.x, // X самолета в пикселях (центр экрана)
        y: containerHeight * (currentAirplane.y / 100) // Y самолета в пикселях
      }
      
      // Проверка коллизий с бонусами
      setActiveBonuses(prev => {
        return prev.filter(bonus => {
          const displayX = bonus.x - currentCameraOffset
          const bonusPos = {
            x: displayX,
            y: bonus.y
          }
          
              // Проверяем коллизию
              if (checkCollision(airplanePos, bonusPos, 50)) {
                // Вызываем обработчик столкновения с координатами
                handleCollisionRef.current('bonus', bonus, displayX, bonus.y)
                return false // Удаляем бонус
              }
          
          // Удаляем бонусы, которые вышли за левый край экрана
          return displayX > -100
        })
      })
      
      // Проверка коллизий с торпедами
      setActiveTorpedoes(prev => {
        return prev.filter(torpedo => {
          const displayX = torpedo.x - currentCameraOffset
          const torpedoPos = {
            x: displayX,
            y: torpedo.y
          }
          
          // Проверяем коллизию (только если торпеда видна, не в режиме предупреждения)
          if (!torpedo.isWarning && checkCollision(airplanePos, torpedoPos, 40)) {
            // Передаем координаты столкновения для взрыва
            handleCollisionRef.current('torpedo', torpedo, displayX, torpedo.y)
            return false // Удаляем торпеду
          }
          
          // Удаляем торпеды, которые вышли за левый край экрана
          return displayX > -100
        })
      })
      
      animationFrameId = requestAnimationFrame(gameLoop)
    }
    
    animationFrameId = requestAnimationFrame(gameLoop)
    
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [airplane.isFlying, gameState.gameStarted, gameState.speed, airplaneCrash, airplaneLanded, gameState.gameEnded, activeShips])
  
  // Загрузка ширины изображения неба
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setSkyImageWidth(img.width)
    }
    img.src = '/sky.jpg'
  }, [])
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (takeoffCancelRef.current) {
        takeoffCancelRef.current()
      }
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={s.container}>
      <div className={s.cloudsLayer}>
        <CloudsLayer />
      </div>
      <div className={s.skyLayer}>
        <div 
          className={s.skyLayerBackground}
          style={{
            backgroundSize: `${skyImageWidth}px 100%`, // Используем реальную ширину в пикселях
            backgroundPosition: `${-(cameraOffset % skyImageWidth)}px 0` // Модульная арифметика по реальной ширине изображения
          }}
        ></div>
        <div 
          className={s.skyLayerOverlay}
          style={{
            backgroundSize: `${skyImageWidth}px 100%`, // Используем реальную ширину в пикселях
            backgroundPosition: `${-(cameraOffset % skyImageWidth)}px 0` // Первый overlay движется синхронно
          }}
        ></div>
        <div 
          className={s.skyLayerOverlaySecond}
          style={{
            backgroundSize: `${skyImageWidth}px 100%`, // Используем реальную ширину в пикселях
            backgroundPosition: `${-(cameraOffset % skyImageWidth)}px 0` // Второй overlay для дополнительного сглаживания
          }}
        ></div>
      </div>
      <div 
        className={s.gradientLayer}
        style={{
          backgroundPosition: `${-(cameraOffset % 480)}px 0` // Модульная арифметика для бесшовного повторения
        }}
      ></div>
              <div className={s.collectiblesLayer}>
                {activeBonuses.map((bonus) => {
                  const displayX = bonus.x - cameraOffset
                  return (
                    <Bonus 
                      key={bonus.id} 
                      bonus={{
                        ...bonus,
                        x: displayX, // позиция на экране (мировые координаты - смещение камеры)
                        y: bonus.y
                      }} 
                    />
                  )
                })}
                {activeTorpedoes.map((torpedo) => {
                  const displayX = torpedo.x - cameraOffset
                  return (
                    <Torpedo 
                      key={torpedo.id} 
                      torpedo={{
                        ...torpedo,
                        x: displayX, // позиция на экране (мировые координаты - смещение камеры)
                        y: torpedo.y
                      }} 
                    />
                  )
                })}
                {activeExplosions.map((explosion) => {
                  return (
                    <Explosion
                      key={explosion.id}
                      x={explosion.x}
                      y={explosion.y}
                      onComplete={() => {
                        setActiveExplosions(prev => prev.filter(e => e.id !== explosion.id))
                      }}
                    />
                  )
                })}
                {bonusParticles.map((particle) => (
                  <BonusParticles
                    key={particle.id}
                    x={particle.x}
                    y={particle.y}
                    value={particle.value}
                    type={particle.type}
                    isActive={true}
                  />
                ))}
              </div>
      {/* Первый корабль (стартовый) - всегда виден */}
      <img 
        className={s.ship} 
        src='/приложение самолет_Монтажная область 1 копия.png' 
        alt="Ship"
        style={{
          transform: `translateX(calc(-50% + ${-cameraOffset}px))`,
          zIndex: 4 // Убеждаемся, что корабль поверх других элементов
        }}
      />
      {/* Дополнительные корабли каждые 200px - все корабли всегда видимы */}
      {activeShips.map((ship) => {
        const displayX = ship.x - cameraOffset
        
        return (
          <img 
            key={ship.id}
            className={s.ship} 
            src='/приложение самолет_Монтажная область 1 копия.png' 
            alt="Ship"
            style={{
              transform: `translateX(calc(-50% + ${displayX}px))`,
              zIndex: 4 // Убеждаемся, что корабль поверх других элементов
            }}
          />
        )
      })}
              <div className={s.airplaneLayer}>
                <Airplane 
                  x={airplane.x}
                  y={airplane.y}
                  rotation={airplane.rotation}
                  isCrashing={airplaneCrash}
                  collisionEffect={collisionEffect}
                />
              </div>
      <div className={s.uiLayer}>
        <UILayer 
          onStartGame={handleStartGame}
          currentBalance={gameState.currentBalance}
          isPlaying={gameState.isPlaying}
        />
      </div>
    </div>
  )
}

export default GameScreen