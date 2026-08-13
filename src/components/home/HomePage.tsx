import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { CircleUserRound, Gift, Images, LogOut, Sparkles, UserRound } from 'lucide-react'
import { Corner } from '../ui/Corner'
import { ImageRevealBackground } from './ImageRevealBackground'
import { CoreInteractiveGrid } from '../../features/core/CoreInteractiveGrid'
import { TryOnSection } from '../../features/tryon/TryOnSection'
import { LoginOverlay } from '../../features/auth/LoginOverlay'
import { getCurrentPackage, getFreeGenerationsRemaining, subscribeToFreeGenerationChanges } from '../../lib/freeGeneration'

const BG_IMAGE_1 = '/images/lgpsm-background-base.png'
const CORE_VIDEO_SOURCES = [
  '/images/outdoor-video.mp4',
  '/images/beach-video.mp4',
  '/images/party-video.mp4',
] as const
const TRY_YOUR_IDEA_IMAGE = '/images/try-your-idea-default.png'

function getAvatarUrl(user: User) {
  if (user.user_metadata.avatar_url) return String(user.user_metadata.avatar_url)
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.id)}&backgroundColor=e2e8f0,cbd5e1,fef3c7,fee2e2,dcfce7`
}

function scrollToSection(section: HTMLElement | null) {
  if (!section) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

function HomePage({ onOpenJoinBeta, onOpenLibrary, onOpenPaywall, user, onSignOut, onAuthenticated }: { onOpenJoinBeta: () => void; onOpenLibrary: () => void; onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio') => void; user: User | null; onSignOut: () => Promise<void>; onAuthenticated: (user: User) => void }) {
  const nextSectionRef = useRef<HTMLElement>(null)
  const tryOnSectionRef = useRef<HTMLElement>(null)
  const [isCoreFunctionVisible, setIsCoreFunctionVisible] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(() => window.location.hash.includes('type=recovery'))
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [freeGenerationsRemaining, setFreeGenerationsRemaining] = useState(() => getFreeGenerationsRemaining())
  const [currentPackage, setCurrentPackage] = useState(() => getCurrentPackage())
  const [activeCoreTab, setActiveCoreTab] = useState(0)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const coreVideoRef = useRef<HTMLVideoElement>(null)
  const isAuthenticatedUser = Boolean(user && !user.is_anonymous)
  const requestedTool = new URLSearchParams(window.location.search).get('tool')
  const requestedImageUrl = new URLSearchParams(window.location.search).get('image')

  useEffect(() => {
    const video = coreVideoRef.current
    if (!video) return
    video.load()
    void video.play().catch(() => undefined)
  }, [activeCoreTab])

  const scrollToNextSection = () => {
    scrollToSection(nextSectionRef.current)
  }

  const scrollToTryOn = () => {
    scrollToSection(tryOnSectionRef.current)
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
    if (!requestedTool || !requestedImageUrl) return
    window.requestAnimationFrame(() => scrollToSection(tryOnSectionRef.current))
  }, [requestedImageUrl, requestedTool])

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
    const syncFreeGenerations = () => {
      setFreeGenerationsRemaining(getFreeGenerationsRemaining())
      setCurrentPackage(getCurrentPackage())
    }
    return subscribeToFreeGenerationChanges(syncFreeGenerations)
  }, [])

  useEffect(() => {
    if (!isAccountMenuOpen) return
    const closeMenu = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAccountMenuOpen(false)
    }
    window.addEventListener('mousedown', closeMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('mousedown', closeMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isAccountMenuOpen])

  return <div className="font-jakarta relative flex min-h-screen flex-col justify-between overflow-x-clip bg-white text-black">
    <ImageRevealBackground />
    {isCoreFunctionVisible && <CoreInteractiveGrid />}
    <header className="home2-header fixed inset-x-0 top-0 z-40 flex items-center justify-between" style={{ paddingInline: 'var(--pad-x)', paddingTop: 'var(--header-pt)', paddingBottom: 'var(--header-pb)' }}>
      <a className="transition-opacity hover:opacity-80" href="#hero-section" aria-label="LGPSM home" onClick={(event) => { event.preventDefault(); scrollToSection(document.getElementById('hero-section')) }}>
        <img src="/images/full-logo.svg" alt="LGPSM" className="home2-header-logo block h-auto w-[169px] max-w-[42vw]" />
      </a>
      <nav aria-label="Main navigation" className="home2-header-nav flex items-center font-medium uppercase tracking-[.2em]" style={{ gap: 'var(--gap-nav)', fontSize: 'var(--nav)' }}>
        <button type="button" onClick={openJoinBeta} className="home2-join-beta-button" aria-label="Join beta now"><Corner position="tl" /><Corner position="tr" /><Corner position="bl" /><Corner position="br" /><Gift size={20} strokeWidth={1.5} aria-hidden="true" /><span>JOIN BETA NOW</span></button>
        {isAuthenticatedUser && user ? (
          <div ref={accountMenuRef} className="home2-account-menu">
            <button type="button" className="home2-avatar-button" aria-label="Open account menu" aria-expanded={isAccountMenuOpen} aria-haspopup="menu" onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}>
              <img src={getAvatarUrl(user)} alt="" />
            </button>
            {isAccountMenuOpen && <div className="home2-account-dropdown" role="menu" aria-label="Account menu">
              <div className="home2-account-summary">
                <div className="home2-account-avatar" aria-hidden="true"><img src={getAvatarUrl(user)} alt="" /></div>
                <div className="home2-account-details"><span title={user.email}>{user.email}</span><div><small>{currentPackage ? `${currentPackage} package` : 'Free plan'}</small><button type="button" onClick={() => onOpenPaywall('studio')}>Upgrade</button></div></div>
              </div>
              <button type="button" className="home2-account-item" role="menuitem" onClick={scrollToTryOn}><span><Sparkles size={16} strokeWidth={1.5} />Generation</span><strong><Sparkles size={10} strokeWidth={1.5} />{freeGenerationsRemaining}</strong></button>
              <button type="button" className="home2-account-item" role="menuitem" onClick={onOpenLibrary}><span><Images size={16} strokeWidth={1.5} />My library</span></button>
              <button type="button" className="home2-account-item" role="menuitem"><span><CircleUserRound size={16} strokeWidth={1.5} />My account</span></button>
              <div className="home2-account-divider" />
              <button type="button" className="home2-account-item" role="menuitem" onClick={() => void onSignOut()}><span><LogOut size={16} strokeWidth={1.5} />Sign out</span></button>
            </div>}
          </div>
        ) : (
          <>
            <button type="button" onClick={scrollToTryOn} className="transition-opacity hover:opacity-50">TRY FREE</button>
            <button type="button" onClick={() => setIsLoginOpen(true)} aria-label="Sign in" title="Sign in" className="home2-profile grid place-items-center rounded-full border border-gray-400 p-2 transition-colors hover:border-black hover:bg-black hover:text-white"><UserRound size="var(--icon)" strokeWidth={1.5} /></button>
          </>
        )}
      </nav>
    </header>
    <main id="hero-section" className="relative z-10 flex min-h-screen flex-1 flex-col justify-between gap-10 lg:flex-row lg:items-center" style={{ paddingInline: 'var(--pad-x)', paddingBlock: 'var(--main-py)' }}>
      <section className="flex flex-col items-start"><div className="relative h-[var(--corner)] w-[var(--corner)]"><Corner position="tl" /></div><img src="/images/lgpsm-hero-logo.svg" alt="Future Forward Fashion" className="mt-[var(--section-gap)] block h-auto w-[min(34rem,82vw)]" /><p className="mt-[var(--section-gap)] max-w-[min(31rem,82vw)] font-jakarta text-[var(--body)] italic leading-relaxed tracking-[.02em] text-gray-700">From imagination to stunning visuals in seconds. Create, edit, and restyle with effortless AI.</p><div className="relative mt-[var(--section-gap)] h-[var(--corner)] w-[var(--corner)]"><Corner position="bl" /></div><div className="mt-[var(--section-gap)] flex flex-wrap items-center" style={{ gap: 'var(--btn-gap)' }}>
        <button type="button" onClick={openJoinBeta} className="button-primary">JOIN BETA <img className="hero-button-arrow-light" src="/images/hero-button-arrow.svg" alt="" aria-hidden="true" /></button>
        <button type="button" onClick={scrollToTryOn} className="button-secondary">TRY FREE <img src="/images/hero-button-arrow.svg" alt="" aria-hidden="true" /></button>
      </div></section>
      <button type="button" onClick={scrollToNextSection} className="relative self-end text-right transition-opacity hover:opacity-70" style={{ minWidth: 'var(--feature-min)', padding: 'var(--feature-pad)' }} aria-label="Explore core function"><Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/><span className="flex flex-col items-end gap-4"><img src="/images/lgpsm-feature-icon.svg" alt="" className="block h-auto w-[var(--globe)]" /><span className="font-semibold uppercase tracking-[.18em]" style={{ fontSize: 'var(--body)', lineHeight: 1.65 }}>Explore core function</span></span></button>
    </main>
    <section ref={nextSectionRef} id="core-functions" className="core-functions-screen relative z-10 min-h-screen overflow-hidden bg-transparent" aria-labelledby="core-functions-title">
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
                  <video ref={coreVideoRef} className="core-iphone-video" src={CORE_VIDEO_SOURCES[activeCoreTab]} autoPlay muted loop playsInline preload="metadata" aria-label="Fashion video preview" />
                )}
              </div>
              <img className="core-iphone-frame" src="/images/iphone-17-pro-silver.png" alt="iPhone showing a fashion preview" />
            </div>
          </div>
        </div>
      </div>
    </section>
    <TryOnSection sectionRef={tryOnSectionRef} user={user} onRequestLogin={() => setIsLoginOpen(true)} onOpenPaywall={onOpenPaywall} initialTool={requestedTool === 'try-on' || requestedTool === 'magic-editor' ? requestedTool : undefined} initialImageUrl={requestedImageUrl} />
    <section className="relative z-10 mx-[var(--pad-x)] mb-[var(--pad-y)] aspect-[4/5] border border-gray-200 bg-cover bg-center sm:aspect-[16/9] lg:hidden" style={{ backgroundImage: `url("${BG_IMAGE_1}")` }} aria-label="LGPSM collection preview" />

    {isLoginOpen && <LoginOverlay onClose={() => setIsLoginOpen(false)} onAuthenticated={(authenticatedUser) => { onAuthenticated(authenticatedUser); setIsLoginOpen(false) }} />}

  </div>
}

export { HomePage }
