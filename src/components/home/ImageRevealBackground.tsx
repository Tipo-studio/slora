import { useEffect, useRef } from 'react'

const BASE_IMAGE = '/images/lgpsm-background-base.png'
const REVEAL_IMAGE = '/images/lgpsm-hero-hover.png'

function ImageRevealBackground() {
  const revealRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<SVGPatternElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mediaQuery.matches || reducedMotionQuery.matches) return

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const smooth = { ...mouse }
    const offset = { x: 0, y: 0 }
    let frame = 0
    let cell = 48

    const resize = () => {
      cell = Math.round(Math.min(64, Math.max(36, window.innerWidth * 0.028)))
      const path = document.getElementById('reveal-grid-path')
      if (path) path.setAttribute('d', `M ${cell} 0 L 0 0 0 ${cell}`)
      const pattern = document.getElementById('reveal-grid-pattern')
      pattern?.setAttribute('width', String(cell))
      pattern?.setAttribute('height', String(cell))
    }
    const draw = () => {
      smooth.x += (mouse.x - smooth.x) * 0.1
      smooth.y += (mouse.y - smooth.y) * 0.1
      if (revealRef.current) {
        revealRef.current.style.setProperty('--reveal-x', `${smooth.x}px`)
        revealRef.current.style.setProperty('--reveal-y', `${smooth.y}px`)
      }
      const normalizedX = smooth.x / window.innerWidth - 0.5
      const normalizedY = smooth.y / window.innerHeight - 0.5
      offset.x += (normalizedX * 16 - offset.x) * 0.06
      offset.y += (normalizedY * 16 - offset.y) * 0.06
      if (gridRef.current) {
        gridRef.current.setAttribute('x', String(offset.x))
        gridRef.current.setAttribute('y', String(offset.y))
      }
      if (Math.abs(mouse.x - smooth.x) > 0.1 || Math.abs(mouse.y - smooth.y) > 0.1) frame = requestAnimationFrame(draw)
      else frame = 0
    }
    const move = (event: MouseEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const onMotionPreferenceChange = () => {
      if (reducedMotionQuery.matches) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }
    resize()
    window.addEventListener('mousemove', move)
    window.addEventListener('resize', resize)
    reducedMotionQuery.addEventListener('change', onMotionPreferenceChange)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('resize', resize)
      reducedMotionQuery.removeEventListener('change', onMotionPreferenceChange)
    }
  }, [])

  const common = { backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } as const
  return <div className="desktop-reveal fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0" style={{ ...common, backgroundImage: `url("${BASE_IMAGE}")` }} />
    <div ref={revealRef} className="image-reveal-layer absolute inset-0" style={{ ...common, backgroundImage: `url("${REVEAL_IMAGE}")` }} />
    <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg"><defs><pattern ref={gridRef} id="reveal-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse"><path id="reveal-grid-path" d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" strokeWidth="0.6" /></pattern></defs><rect width="100%" height="100%" fill="url(#reveal-grid-pattern)" /></svg>
  </div>
}

export { ImageRevealBackground }
