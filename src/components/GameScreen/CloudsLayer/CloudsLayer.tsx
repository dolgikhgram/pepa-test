import { useState, useEffect } from 'react'
import Cloud from '../Cloud/Cloud'

interface CloudData {
  id: string
  imageIndex: number
  top: number
  speed: number
  delay: number
}

const CloudsLayer = () => {
  const [clouds, setClouds] = useState<CloudData[]>([])

  useEffect(() => {
    // Генерируем случайное количество облаков (от 5 до 15)
    const cloudCount = Math.floor(Math.random() * 11) + 5
    
    const newClouds: CloudData[] = []
    
    for (let i = 0; i < cloudCount; i++) {
      newClouds.push({
        id: `cloud-${i}`,
        imageIndex: Math.floor(Math.random() * 8), // Случайная картинка из 8
        top: Math.random() * 50, // Случайная позиция сверху (0-50% для неба)
        speed: Math.random() * 30 + 20, // Случайная скорость (20-50 секунд)
        delay: Math.random() * 10, // Случайная задержка старта (0-10 секунд)
      })
    }
    
    setClouds(newClouds)
  }, [])

  return (
    <>
      {clouds.map((cloud) => (
        <Cloud
          key={cloud.id}
          imageIndex={cloud.imageIndex}
          top={cloud.top}
          speed={cloud.speed}
          delay={cloud.delay}
        />
      ))}
    </>
  )
}

export default CloudsLayer
