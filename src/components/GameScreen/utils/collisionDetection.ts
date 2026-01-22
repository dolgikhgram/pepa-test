/**
 * Проверяет коллизию между самолетом и объектом (бонус/торпеда)
 * @param airplane - позиция самолета { x, y }
 * @param item - позиция объекта { x, y }
 * @param threshold - порог расстояния для коллизии (в пикселях)
 * @returns true если произошла коллизия
 */
export const checkCollision = (
  airplane: { x: number; y: number },
  item: { x: number; y: number },
  threshold: number = 40
): boolean => {
  const dx = airplane.x - item.x
  const dy = airplane.y - item.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < threshold
}

