import { useEffect, useRef } from 'react'

const BASE_IMAGE = '/images/lgpsm-background-base.png'
const REVEAL_IMAGE = '/images/lgpsm-hero-hover.png'

function ImageRevealBackground() {
  const revealRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<SVGPatternElement>(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const smooth = { ...mouse }
    const offset = { x: 0, y: 0 }
    let frame = 0
    let cell = 48

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cell = Math.round(Math.min(64, Math.max(36, window.innerWidth * 0.028)))
      const path = document.getElementById('reveal-grid-path')
      if (path) path.setAttribute('d', `M ${cell} 0 L 0 0 0 ${cell}`)
      const pattern = document.getElementById('reveal-grid-pattern')
      pattern?.setAttribute('width', String(cell))
      pattern?.setAttribute('height', String(cell))
    }
    const move = (event: MouseEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
    }
    const draw = () => {
      smooth.x += (mouse.x - smooth.x) * 0.1
      smooth.y += (mouse.y - smooth.y) * 0.1
      const radius = Math.round(Math.min(420, Math.max(160, window.innerWidth * 0.16)))
      context.clearRect(0, 0, canvas.width, canvas.height)
      const gradient = context.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, radius)
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.4, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)')
      gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)')
      gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = gradient
      context.fillRect(smooth.x - radius, smooth.y - radius, radius * 2, radius * 2)
      const mask = `url(${canvas.toDataURL()})`
      if (revealRef.current) {
        revealRef.current.style.maskImage = mask
        revealRef.current.style.webkitMaskImage = mask
      }
      const normalizedX = smooth.x / window.innerWidth - 0.5
      const normalizedY = smooth.y / window.innerHeight - 0.5
      offset.x += (normalizedX * 16 - offset.x) * 0.06
      offset.y += (normalizedY * 16 - offset.y) * 0.06
      if (gridRef.current) {
        gridRef.current.setAttribute('x', String(offset.x))
        gridRef.current.setAttribute('y', String(offset.y))
      }
      frame = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('mousemove', move)
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('mousemove', move); window.removeEventListener('resize', resize) }
  }, [])

  const common = { backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } as const
  return <div className="desktop-reveal fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0" style={{ ...common, backgroundImage: `url("${BASE_IMAGE}")` }} />
    <div ref={revealRef} className="absolute inset-0" style={{ ...common, backgroundImage: `url("${REVEAL_IMAGE}")`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }} />
    <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg"><defs><pattern ref={gridRef} id="reveal-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse"><path id="reveal-grid-path" d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" strokeWidth="0.6" /></pattern></defs><rect width="100%" height="100%" fill="url(#reveal-grid-pattern)" /></svg>
  </div>
}

export { ImageRevealBackground }
