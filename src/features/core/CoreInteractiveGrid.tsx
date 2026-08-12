import { useEffect, useRef } from 'react'

function CoreInteractiveGrid() {
  const gridRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mediaQuery.matches || reducedMotionQuery.matches) return

    const target = { x: -1000, y: -1000 }
    const current = { x: -1000, y: -1000 }
    let frame = 0
    let active = true

    const measureTiles = () => {
      const gridBounds = grid.getBoundingClientRect()
      tileRefs.current.forEach((tile) => {
        if (!tile) return
        const bounds = tile.getBoundingClientRect()
        tile.dataset.x = String(bounds.left - gridBounds.left + bounds.width / 2)
        tile.dataset.y = String(bounds.top - gridBounds.top + bounds.height / 2)
      })
    }
    const move = (event: MouseEvent) => {
      const bounds = grid.getBoundingClientRect()
      target.x = event.clientX - bounds.left
      target.y = event.clientY - bounds.top
    }
    const leave = () => { target.x = -1000; target.y = -1000 }
    const animate = () => {
      current.x += (target.x - current.x) * 0.075
      current.y += (target.y - current.y) * 0.075
      grid.style.setProperty('--cursor-x', `${current.x}px`)
      grid.style.setProperty('--cursor-y', `${current.y}px`)
      tileRefs.current.forEach((tile) => {
        if (!tile) return
        const x = Number(tile.dataset.x ?? 0)
        const y = Number(tile.dataset.y ?? 0)
        const distance = Math.hypot(current.x - x, current.y - y)
        const influence = Math.max(0, 1 - distance / 190)
        const lift = influence * 42 + Number(tile.dataset.baseLift ?? 0)
        const scale = 1 + influence * 0.095
        const tiltX = (current.y - y) * influence * 0.04
        const tiltY = (x - current.x) * influence * 0.04
        tile.style.transform = `translate3d(0, ${-lift.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`
        tile.style.setProperty('--tile-light', (0.12 + influence * 0.62).toFixed(3))
        tile.style.setProperty('--tile-border', (0.12 + influence * 0.62).toFixed(3))
      })
      if (active && !reducedMotionQuery.matches) frame = requestAnimationFrame(animate)
    }
    const onMotionPreferenceChange = () => {
      if (reducedMotionQuery.matches) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    measureTiles()
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseleave', leave)
    window.addEventListener('resize', measureTiles)
    reducedMotionQuery.addEventListener('change', onMotionPreferenceChange)
    frame = requestAnimationFrame(animate)
    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseleave', leave)
      window.removeEventListener('resize', measureTiles)
      reducedMotionQuery.removeEventListener('change', onMotionPreferenceChange)
    }
  }, [])

  const tiles = Array.from({ length: 480 }, (_, index) => {
    const column = index % 24
    const row = Math.floor(index / 24)
    const baseLift = ((index * 17) % 7) / 10
    return <div
      key={index}
      ref={(element) => { tileRefs.current[index] = element }}
      className="core-grid-tile"
      data-x={column * 76 + 38}
      data-y={row * 76 + 38}
      data-base-lift={baseLift}
    />
  })

  return <div ref={gridRef} className="core-interactive-grid" aria-hidden="true"><div className="core-grid-spotlight" />{tiles}</div>
}

export { CoreInteractiveGrid }
