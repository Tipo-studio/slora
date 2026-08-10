import { useEffect, useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Corner } from '../ui/Corner'
import { ImageRevealBackground } from './ImageRevealBackground'
import { CoreInteractiveGrid } from '../../features/core/CoreInteractiveGrid'
import { TryOnSection } from '../../features/tryon/TryOnSection'
import { LoginOverlay } from '../../features/auth/LoginOverlay'

const BG_IMAGE_1 = '/images/lgpsm-background-base.png'
const CORE_VIDEO_SOURCES = [
  '/images/outdoor-video.mp4',
  '/images/beach-video.mp4',
  '/images/party-video.mp4',
] as const
const TRY_YOUR_IDEA_IMAGE = '/images/try-your-idea-default.png'

function HomePage({ onOpenJoinBeta }: { onOpenJoinBeta: () => void }) {
  const nextSectionRef = useRef<HTMLElement>(null)
  const tryOnSectionRef = useRef<HTMLElement>(null)
  const [isCoreFunctionVisible, setIsCoreFunctionVisible] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
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

  const openJoinBeta = onOpenJoinBeta

  useEffect(() => {
    const section = nextSectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(([entry]) => setIsCoreFunctionVisible(entry.isIntersecting), { threshold: 0.6 })
    observer.observe(section)
    return () => observer.disconnect()
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
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0) {
        event.preventDefault()
        const target = event.deltaY > 0 ? nextSectionRef.current : document.getElementById('hero-section')
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

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

export { HomePage }
