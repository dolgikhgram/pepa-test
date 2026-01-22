import s from './UILayer.module.css'
import { useEffect, useState, useRef } from 'react'

interface UILayerProps {
  onStartGame: () => void
  currentBalance: number
  isPlaying: boolean
}

const UILayer = ({ onStartGame, currentBalance, isPlaying }: UILayerProps) => {
  const [balanceAnimation, setBalanceAnimation] = useState<'increase' | 'decrease' | null>(null)
  const prevBalanceRef = useRef(currentBalance)

  useEffect(() => {
    if (prevBalanceRef.current !== currentBalance) {
      const isIncrease = currentBalance > prevBalanceRef.current
      prevBalanceRef.current = currentBalance
      
      // Устанавливаем анимацию при изменении баланса
      setBalanceAnimation(isIncrease ? 'increase' : 'decrease')
      
      // Сбрасываем анимацию через 0.6 секунды
      const timer = setTimeout(() => {
        setBalanceAnimation(null)
      }, 600)
      
      return () => clearTimeout(timer)
    }
  }, [currentBalance])
  return (
    <div className={s.uiLayer}>
      {/* Logo */}
      <div className={s.logoContainer}>
        <img src="/logo.svg" alt="Logo" className={s.logo} />
      </div>
      
      {/* Mode Selection */}
      <div className={s.modeSelection}>
        <span className={s.mode}>Normal</span>
        <span className={`${s.mode} ${s.modeActive}`}>Fast</span>
      </div>

      {/* Value Adjustment */}
      <div className={s.valueAdjustment}>
        <button className={s.adjustButton}>-</button>
        <div className={s.valueDisplay}>
          <span className={`${s.valueText} ${balanceAnimation ? s[balanceAnimation] : ''}`}>{currentBalance}</span>
          <img src='ton.svg'/>
        </div>
        <button className={s.adjustButton}>+</button>
      </div>

      {/* Preset Values */}
      <div className={s.presetButtons}>
        <button className={s.presetButton}>
          <div className={s.presetButtonValue}>1</div>
          <img src='ton.svg'/>
        </button>
        <button className={s.presetButton}>
          <div className={s.presetButtonValue}>5</div>
          <img src='ton.svg'/>
        </button>
        <button className={s.presetButton}>
          <div className={s.presetButtonValue}>10</div>
          <img src='ton.svg'/>
        </button>
        <button className={s.presetButton}>
          <div className={s.presetButtonValue}>20</div>
          <img src='ton.svg'/>
        </button>
        <button className={s.presetButton}>
          <div className={s.presetButtonValue}>50</div>
          <img src='ton.svg'/>
        </button>
        
      </div>

      {/* Autoplay Section */}
      <div className={s.autoplaySection}>
        <button className={s.autoplayButton}>
          <div className={s.autoplayCenter}>
            <span className={s.autoplayText}>Autoplay</span>
            <span className={s.autoplayIcon}>
              <img src='Shape.svg' alt='shape'/>
            </span>
          </div>
          <span className={s.caretIcon}>
            <img src='Vector.svg' alt='vector'/>
          </span>
        </button>
      </div>

      {/* Play Button */}
      <button 
        className={s.playButton} 
        onClick={onStartGame}
        disabled={isPlaying}
      >
        <div className={s.playButtonText}>
          {isPlaying ? 'Playing...' : 'Play'}
        </div>
      </button>
    </div>
  )
}

export default UILayer

