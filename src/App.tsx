import { useEffect, useRef, useState, type RefObject } from 'react'
import { UserRound } from 'lucide-react'

// User-supplied hero images: base layer and cursor-revealed layer.
const BG_IMAGE_1 = '/images/lgpsm-background-base.png'
const BG_IMAGE_2 = '/images/lgpsm-hero-hover.png'
const CORE_VIDEO_SOURCES = [
  '/images/outdoor-video.mp4',
  '/images/beach-video.mp4',
  '/images/party-video.mp4',
] as const
const TRY_YOUR_IDEA_IMAGE = '/images/try-your-idea-default.png'


function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const paths = {
    tl: 'M0 11.5V0.5H11.5', tr: 'M0.5 0.5H11.5V11.5',
    bl: 'M0 0.5V11.5H11.5', br: 'M0.5 11.5H11.5V0.5',
  }
  const place = { tl: 'left-0 top-0', tr: 'right-0 top-0', bl: 'bottom-0 left-0', br: 'bottom-0 right-0' }
  return <svg aria-hidden="true" className={`absolute ${place[position]}`} width="var(--corner)" height="var(--corner)" viewBox="0 0 12 12" fill="none"><path d={paths[position]} stroke="currentColor" strokeWidth="1.5" /></svg>
}

function TryOnUploadCard({ label, samples }: { label: string; samples: readonly string[] }) {
  return <label className="tryon-upload-card">
    <input type="file" accept="image/png,image/jpeg" className="tryon-file-input" />
    <img className="tryon-upload-grid" src="/images/tryon/upload-grid.svg" alt="" aria-hidden="true" />
    <div className="tryon-upload-content">
      <span className="tryon-upload-icon"><img src="/images/tryon/image-icon.svg" alt="" aria-hidden="true" /></span>
      <span className="tryon-upload-title">{label}</span>
      <span className="tryon-upload-note">jpeg, png formats up to 5Mb</span>
      <span className="tryon-samples">{samples.map((sample) => <img key={sample} src={sample} alt="" />)}</span>
    </div>
  </label>
}

function TryOnSection({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const [isTryOnLoading, setIsTryOnLoading] = useState(false)
  const personSamples = ['/images/tryon/person-1.png', '/images/tryon/person-2.png', '/images/tryon/person-3.png', '/images/tryon/person-4.png'] as const
  const clothesSamples = ['/images/tryon/clothes-1.png', '/images/tryon/clothes-2.png', '/images/tryon/clothes-3.png', '/images/tryon/clothes-4.png'] as const

  return <section ref={sectionRef} id="tryon" className="tryon-screen relative z-10 min-h-screen snap-start" aria-labelledby="tryon-title">
    <img className="tryon-background" src="/images/tryon/background.png" alt="" aria-hidden="true" />
    <div className="tryon-layout">
      <div className="tryon-controls">
        <h2 id="tryon-title">TRY-ON<br />EVERYTHING</h2>
        <div className="tryon-upload-stack">
          <TryOnUploadCard label="Upload person" samples={personSamples} />
          <TryOnUploadCard label="Upload Cloths" samples={clothesSamples} />
          <button type="button" className="tryon-cta button-primary" onClick={() => setIsTryOnLoading(true)} disabled={isTryOnLoading}><img src="/images/tryon/try-now-icon.svg" alt="" aria-hidden="true" />TRY NOW</button>
        </div>
      </div>
      <div className="tryon-preview" aria-label="Try-on result preview">
        <p>See yourself wearing dresses, streetwear, bikinis, formal wear and more.</p>
        <div className={`tryon-phone-frame ${isTryOnLoading ? 'is-loading' : ''}`} data-figma-node-id={isTryOnLoading ? '11790:1568' : '11787:1320'} aria-label={isTryOnLoading ? 'Generating try-on image' : undefined}>
          {isTryOnLoading ? <img key="loading" className="tryon-genimg-placeholder" src="/images/tryon/genimg-loading.svg" alt="" aria-hidden="true" /> : <img key="default" src="/images/tryon/phone-frame.svg" alt="" aria-hidden="true" />}
        </div>
        <img className="tryon-model" data-figma-node-id="11787:1347" src="/images/tryon/model.png" alt="Virtual try-on model" />
        <img className="tryon-model-shadow" data-figma-node-id="11787:1349" src="/images/tryon/model-shadow.svg" alt="" aria-hidden="true" />
      </div>
    </div>
  </section>
}

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
    <div className="absolute inset-0" style={{ ...common, backgroundImage: `url("${BG_IMAGE_1}")` }} />
    <div ref={revealRef} className="absolute inset-0" style={{ ...common, backgroundImage: `url("${BG_IMAGE_2}")`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }} />
    <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg"><defs><pattern ref={gridRef} id="reveal-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse"><path id="reveal-grid-path" d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" strokeWidth="0.6" /></pattern></defs><rect width="100%" height="100%" fill="url(#reveal-grid-pattern)" /></svg>
  </div>
}

function LoginOverlay({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  return <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
    <div className="login-backdrop" onClick={onClose} />
    <div className="login-panel">
      <img className="login-decoration" src="/images/login/background.svg" alt="" aria-hidden="true" />
      <button type="button" className="login-close" onClick={onClose} aria-label="Close login dialog"><img src="/images/login/close.svg" alt="" aria-hidden="true" /></button>
      <div className="login-content">
        <div className="login-intro">
          <img className="login-logo" src="/images/full-logo.svg" alt="Slora" />
          <p id="login-title">Sign in now for free generate</p>
        </div>
        <div className="login-form">
          <button type="button" className="login-google"><img src="/images/login/google.svg" alt="" aria-hidden="true" /><span>Sign in with Google</span></button>
          <p className="login-or">or</p>
          <p className="login-email-label">Continue with email</p>
          <input className="login-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" aria-label="Email address" />
          <input className="login-field" type="text" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Get verification code" aria-label="Verification code" />
          <button type="button" className="login-submit button-primary">SIGN IN</button>
        </div>
        <p className="login-terms">By proceeding with the login process, you agree to our <a href="https://www.weshop.ai/policy" target="_blank" rel="noreferrer">User Service Agreement</a> and <a href="https://www.weshop.ai/privacy" target="_blank" rel="noreferrer">Privacy Policy.</a></p>
      </div>
    </div>
  </div>
}

const JOIN_BETA_ROLES = ['Fashion Brand Owner', 'Online Seller', 'Marketing Agency', 'Content Creator', 'Photographer', 'Designer', 'E-commerce Team', 'Retail Store Manager']
const JOIN_BETA_GOALS = ['Create model photos without hiring models', 'Change clothing on existing photos', 'Generate product marketing content', 'Create social media posts faster', 'Build lookbooks and catalogs', 'write what you want']

function JoinBetaPage({ onBack }: { onBack: () => void }) {
  const [role, setRole] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [task, setTask] = useState('')
  const [exampleName, setExampleName] = useState('')
  const toggleGoal = (goal: string) => setGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal])

  return <main className="join-beta-page" data-figma-node-id="11798:1773">
    <button type="button" className="join-beta-home" onClick={onBack} aria-label="Back to home"><img src="/images/full-logo.svg" alt="Slora" /></button>
    <img className="join-beta-logo" src="/images/join-beta-logo.svg" alt="Join beta" />
    <div className="join-beta-model" aria-hidden="true"><img src="/images/tryon/model.png" alt="" /><img src="/images/tryon/model-shadow.svg" alt="" /></div>
    <form className="join-beta-form" onSubmit={(event) => event.preventDefault()}>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${role ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${role ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />1</span><h1>What best describes you?</h1></div><div className="join-beta-options join-beta-role-options">{JOIN_BETA_ROLES.map((item) => <button key={item} type="button" className={`join-beta-chip ${role === item ? 'is-selected' : ''}`} onClick={() => setRole(item)}>{role === item && <img src="/images/join-beta-role.svg" alt="" aria-hidden="true" />}{item}</button>)}</div></section>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${goals.length > 0 ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${goals.length > 0 ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />2</span><h2>What are you hoping to achieve with AI-generated fashion images?</h2></div><div className="join-beta-options join-beta-goal-options">{JOIN_BETA_GOALS.map((item) => <button key={item} type="button" className={`join-beta-goal ${goals.includes(item) ? 'is-selected' : ''}`} onClick={() => toggleGoal(item)}><span className="join-beta-checkbox">{goals.includes(item) && <img src="/images/join-beta-check.svg" alt="" aria-hidden="true" />}</span>{item}</button>)}</div></section>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${task.trim() ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${task.trim() ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />1</span><h2>If you could magically automate one task, what would it be?</h2></div><textarea className="join-beta-textarea" value={task} onChange={(event) => setTask(event.target.value)} placeholder={'"Upload a clothing photo and instantly generate 20 realistic model images for different body types and poses."'} /></section>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${exampleName ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${exampleName ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />2</span><h2>Upload an example (Optional but highly valuable)</h2></div><label className="join-beta-upload"><input type="file" accept="image/png,image/jpeg" onChange={(event) => setExampleName(event.target.files?.[0]?.name ?? '')} /><span className="join-beta-upload-icon"><img src="/images/join-beta-image.svg" alt="" aria-hidden="true" /></span><span>{exampleName || "Show us what you're trying to create."}</span></label></section>
      <section className="join-beta-footer"><p>Thank you for helping us build a better product.</p><button type="submit" className="join-beta-submit button-primary"><img src="/images/join-beta-step.svg" alt="" aria-hidden="true" />TAKE FREE NOW</button><p className="join-beta-reward">You'll receive:<br /><strong>5 time Generate now</strong><br />Early Access Invitation at Launch</p></section>
    </form>
  </main>
}

function CoreInteractiveGrid() {
  const gridRef = useRef<HTMLDivElement>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
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
      if (active) frame = requestAnimationFrame(animate)
    }

    measureTiles()
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseleave', leave)
    window.addEventListener('resize', measureTiles)
    frame = requestAnimationFrame(animate)
    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseleave', leave)
      window.removeEventListener('resize', measureTiles)
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


function App() {
  const nextSectionRef = useRef<HTMLElement>(null)
  const tryOnSectionRef = useRef<HTMLElement>(null)
  const [isCoreFunctionVisible, setIsCoreFunctionVisible] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isJoinBetaPage, setIsJoinBetaPage] = useState(() => window.location.pathname === '/join-beta')
  const [activeCoreTab, setActiveCoreTab] = useState(0)
  const coreVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = coreVideoRef.current
    if (!video) return
    video.load()
    void video.play().catch(() => undefined)
  }, [activeCoreTab])

  const scrollToNextSection = () => {
    nextSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToTryOn = () => {
    tryOnSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openJoinBeta = () => {
    window.history.pushState({}, '', '/join-beta')
    setIsJoinBetaPage(true)
  }

  const closeJoinBeta = () => {
    window.history.pushState({}, '', '/')
    setIsJoinBetaPage(false)
  }

  useEffect(() => {
    const section = nextSectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(([entry]) => setIsCoreFunctionVisible(entry.isIntersecting), { threshold: 0.6 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onPopState = () => setIsJoinBetaPage(window.location.pathname === '/join-beta')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!isLoginOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLoginOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isLoginOpen])

  useEffect(() => {
    if (isJoinBetaPage) return
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0) {
        event.preventDefault()
        const target = event.deltaY > 0 ? nextSectionRef.current : document.getElementById('hero-section')
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [isJoinBetaPage])

  if (isJoinBetaPage) return <JoinBetaPage onBack={closeJoinBeta} />

  return <div className="font-jakarta relative flex min-h-screen flex-col justify-between overflow-hidden bg-white text-black">
    <ImageRevealBackground />
    {isCoreFunctionVisible && <CoreInteractiveGrid />}
    <header className="home2-header fixed inset-x-0 top-0 z-40 flex items-center justify-between" style={{ paddingInline: 'var(--pad-x)', paddingTop: 'var(--header-pt)', paddingBottom: 'var(--header-pb)' }}>
      <a className="transition-opacity hover:opacity-80" href="#hero-section" aria-label="LGPSM home">
        <img src="/images/full-logo.svg" alt="LGPSM" className="home2-header-logo block h-auto w-[169px] max-w-[42vw]" />
      </a>
      <nav aria-label="Main navigation" className="home2-header-nav flex items-center font-medium uppercase tracking-[.2em]" style={{ gap: 'var(--gap-nav)', fontSize: 'var(--nav)' }}>
        <button type="button" onClick={openJoinBeta} className="transition-opacity hover:opacity-50">JOIN BETA</button>
        <button type="button" onClick={() => setIsLoginOpen(true)} className="transition-opacity hover:opacity-50">TRY FREE</button>
        <button type="button" aria-label="Profile" title="Profile" className="home2-profile grid place-items-center rounded-full border border-gray-400 p-2 transition-colors hover:border-black hover:bg-black hover:text-white"><UserRound size="var(--icon)" strokeWidth={1.5} /></button>
      </nav>
    </header>
    <main id="hero-section" className="relative z-10 flex min-h-screen flex-1 snap-start flex-col justify-between gap-10 lg:flex-row lg:items-center" style={{ paddingInline: 'var(--pad-x)', paddingBlock: 'var(--main-py)' }}>
      <section className="flex flex-col items-start"><div className="relative h-[var(--corner)] w-[var(--corner)]"><Corner position="tl" /></div><img src="/images/lgpsm-hero-logo.svg" alt="Future Forward Fashion" className="mt-[var(--section-gap)] block h-auto w-[min(34rem,82vw)]" /><p className="mt-[var(--section-gap)] max-w-[min(31rem,82vw)] font-jakarta text-[var(--body)] italic leading-relaxed tracking-[.02em] text-gray-700">From imagination to stunning visuals in seconds. Create, edit, and restyle with effortless AI.</p><div className="relative mt-[var(--section-gap)] h-[var(--corner)] w-[var(--corner)]"><Corner position="bl" /></div><div className="mt-[var(--section-gap)] flex flex-wrap items-center" style={{ gap: 'var(--btn-gap)' }}>
        <button type="button" onClick={openJoinBeta} className="button-primary">JOIN BETA <img className="hero-button-arrow-light" src="/images/hero-button-arrow.svg" alt="" aria-hidden="true" /></button>
        <button type="button" onClick={() => setIsLoginOpen(true)} className="button-secondary">TRY FREE <img src="/images/hero-button-arrow.svg" alt="" aria-hidden="true" /></button>
      </div></section>
      <button type="button" onClick={scrollToNextSection} className="relative self-end text-right transition-opacity hover:opacity-70" style={{ minWidth: 'var(--feature-min)', padding: 'var(--feature-pad)' }} aria-label="Explore core function"><Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/><span className="flex flex-col items-end gap-4"><img src="/images/lgpsm-feature-icon.svg" alt="" className="block h-auto w-[var(--globe)]" /><span className="font-semibold uppercase tracking-[.18em]" style={{ fontSize: 'var(--body)', lineHeight: 1.65 }}>Explore core function</span></span></button>
    </main>
    <section ref={nextSectionRef} id="core-functions" className="core-functions-screen relative z-10 min-h-screen snap-start overflow-hidden bg-transparent" aria-labelledby="core-functions-title">
      <div className="core-functions-content">
        <div className="core-functions-columns">
          <div className="core-functions-menu-column">
            <h2 id="core-functions-title">Everything<br />You Need to Create</h2>
            <div className="core-functions-menu" role="tablist" aria-label="Core functions examples">
              {['OUT DOOR', 'GO TO BEACH', 'PARTY', 'TRY YOUR IDEA'].map((label, tab) => (
                <button key={label} type="button" role="tab" aria-selected={activeCoreTab === tab} className={`core-function-menu-item ${activeCoreTab === tab ? 'is-active' : ''}`} onClick={() => { setActiveCoreTab(tab); if (tab === 3) scrollToTryOn() }}>
                  <Corner position="tl" />
                  <Corner position="tr" />
                  <Corner position="bl" />
                  <Corner position="br" />
                  <span>{label}</span>
                  <img src="/images/arrow-design.svg" alt="" aria-hidden="true" />
                </button>
              ))}
            </div>
            <ul className="core-functions-benefits">
              <li>Keep your real face and identity.</li>
              <li>Edit only what you choose.</li>
              <li>Natural, realistic results every time.</li>
              <li>No prompts. No complex settings. Just tap and create.</li>
              <li>Professional-quality images in seconds.</li>
            </ul>
          </div>
          <div className="core-functions-media-column">
            <p>Create, edit and transform stunning images with powerful AI Slora—all in one click.</p>
            <div className="core-iphone-stage" aria-label="AI fashion preview">
              <div className="core-iphone-screen">
                {activeCoreTab === 3 ? (
                  <img className="core-iphone-default-image" src={TRY_YOUR_IDEA_IMAGE} alt="Try your idea preview" />
                ) : (
                  <video ref={coreVideoRef} className="core-iphone-video" src={CORE_VIDEO_SOURCES[activeCoreTab]} autoPlay muted loop playsInline preload="auto" aria-label="Fashion video preview" />
                )}
              </div>
              <img className="core-iphone-frame" src="/images/iphone-17-pro-silver.png" alt="iPhone showing a fashion preview" />
            </div>
          </div>
        </div>
      </div>
    </section>
    <TryOnSection sectionRef={tryOnSectionRef} />
    <section className="relative z-10 mx-[var(--pad-x)] mb-[var(--pad-y)] aspect-[4/5] border border-gray-200 bg-cover bg-center sm:aspect-[16/9] lg:hidden" style={{ backgroundImage: `url("${BG_IMAGE_1}")` }} aria-label="LGPSM collection preview" />

    {isLoginOpen && <LoginOverlay onClose={() => setIsLoginOpen(false)} />}

  </div>
}

export default App
export { BG_IMAGE_1, BG_IMAGE_2 }
