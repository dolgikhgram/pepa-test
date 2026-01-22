export type GameState = {
  isPlaying: boolean
  isPaused: boolean
  currentBalance: number
  speed: 'normal' | 'fast'
  isDemo: boolean
  gameStarted: boolean
  gameEnded: boolean
  animationSpeed: number
}
export type Airplane = {
    x: number
    y: number
    rotation: number
    speed: number
    isFlying: boolean
    isLanding: boolean
    angle: number
    velocityX: number
    velocityY: number
    startX: number
    startY: number
    trajectory?: number[]
}

export type Bonus = {
    id: string,
    type: 'multiplier' | 'additive',
    value: number,
    x: number,
    y: number,
    isCollected: boolean 
}

export type Torpedo = {
    id: string,
    x: number,
    y: number,
    isHit: boolean,
    isWarning?: boolean
}

export type GameResult = {
    finalBalance: number
    landingType: 'water' | 'ship_positive' | 'ship_negative'
    multiplier: number
}

export type CollisionEvent = {
    type: 'bonus' | 'torpedo'
    bonus?: Bonus
    torpedo?: Torpedo
    timestamp: number
}

export type Explosion = {
    id: string
    x: number
    y: number
}

export type Ship = {
    id: string
    x: number // позиция в мировых координатах
}