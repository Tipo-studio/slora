import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { CircleUserRound, Gift, Images, LogOut, UserRound } from 'lucide-react'
import { Corner } from '../ui/Corner'
import { ImageRevealBackground } from './ImageRevealBackground'

import { LoginOverlay } from '../../features/auth/LoginOverlay'
import { PromoCodeRedeemer } from './PromoCodeRedeemer'
import { Popup } from '../ui/Popup'
import { requestBillingSummary } from '../../lib/sivitai'
import { getAvatarUrl } from '../../lib/avatar'
import { GenerationIcon } from '../ui/GenerationIcon'

function PlanIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M15.5005 5C15.5007 4.72591 15.4366 4.45559 15.3132 4.21083C15.1898 3.96607 15.0107 3.75371 14.7902 3.59086C14.5698 3.42801 14.3141 3.31922 14.0439 3.27325C13.7737 3.22729 13.4965 3.24543 13.2346 3.32623C12.9727 3.40703 12.7334 3.54821 12.5361 3.73842C12.3387 3.92862 12.1888 4.16252 12.0984 4.42127C12.008 4.68002 11.9796 4.95639 12.0156 5.22811C12.0516 5.49983 12.1508 5.7593 12.3055 5.98562L10.6311 8.04812L9.12546 4.5875C9.40006 4.35638 9.59695 4.04643 9.68946 3.69964C9.78196 3.35285 9.7656 2.98601 9.6426 2.64884C9.51959 2.31166 9.29589 2.02046 9.00181 1.81471C8.70773 1.60895 8.35749 1.4986 7.99858 1.4986C7.63967 1.4986 7.28944 1.60895 6.99536 1.81471C6.70128 2.02046 6.47757 2.31166 6.35457 2.64884C6.23156 2.98601 6.2152 3.35285 6.30771 3.69964C6.40021 4.04643 6.59711 4.35638 6.87171 4.5875L5.36983 8.04625L3.69546 5.98375C3.91055 5.66859 4.01674 5.29177 3.99786 4.91068C3.97898 4.52958 3.83607 4.1651 3.59089 3.87274C3.3457 3.58039 3.01169 3.37617 2.63971 3.2912C2.26773 3.20623 1.87817 3.24516 1.53037 3.40207C1.18256 3.55897 0.895568 3.82525 0.713094 4.16035C0.53062 4.49545 0.462666 4.881 0.519581 5.2583C0.576496 5.63559 0.755161 5.98394 1.02837 6.2503C1.30157 6.51665 1.65434 6.68642 2.03296 6.73375L2.93796 12.1644C2.97686 12.3978 3.09733 12.61 3.27791 12.763C3.4585 12.916 3.68751 13 3.92421 13H12.0767C12.3134 13 12.5424 12.916 12.723 12.763C12.9036 12.61 13.0241 12.3978 13.063 12.1644L13.9673 6.73625C14.3906 6.68339 14.7799 6.47778 15.0622 6.15806C15.3446 5.83834 15.5004 5.42652 15.5005 5Z" fill="#080D14" /></svg>
}

const CORE_VIDEO_SOURCES = [
  '/images/outdoor-video.mp4',
  '/images/beach-video.mp4',
  '/images/party-video.mp4',
] as const
const TRY_YOUR_IDEA_IMAGE = '/images/try-your-idea-default.png'


function scrollToSection(section: HTMLElement | null) {
  if (!section) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

function HomePage({ onOpenJoinBeta, onOpenLibrary, onOpenAccount, onOpenFunction, onOpenPaywall, user, onSignOut, onAuthenticated }: { onOpenJoinBeta: () => void; onOpenLibrary: () => void; onOpenAccount: () => void; onOpenFunction: (tool?: 'try-on' | 'magic-editor') => void; onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => void; user: User | null; onSignOut: () => Promise<void>; onAuthenticated: (user: User) => void }) {
  const nextSectionRef = useRef<HTMLElement>(null)
  const [isLoginOpen, setIsLoginOpen] = useState(() => window.location.hash.includes('type=recovery'))
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [freeGenerationsRemaining, setFreeGenerationsRemaining] = useState(0)
  const [currentPackage, setCurrentPackage] = useState<string | null>(null)
  const [hasSubmittedJoinBeta, setHasSubmittedJoinBeta] = useState(() => window.localStorage.getItem('join-beta-submitted') === 'true')
  const [activeCoreTab, setActiveCoreTab] = useState(0)
  const [promoGenerationUpdate, setPromoGenerationUpdate] = useState<{ granted: number; remaining: number } | null>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const coreVideoRef = useRef<HTMLVideoElement>(null)
  const isAuthenticatedUser = Boolean(user && !user.is_anonymous)

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
    onOpenFunction('try-on')
  }

  const openJoinBeta = onOpenJoinBeta

  useEffect(() => {
    // Creative tools are hosted on the dedicated /function route.
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
    if (!isAuthenticatedUser) return
    let isCurrent = true
    void requestBillingSummary()
      .then(({ balance, package: packageName }) => {
        if (!isCurrent) return
        setFreeGenerationsRemaining(balance)
        setCurrentPackage(packageName as typeof currentPackage)
      })
      .catch(() => undefined)
    return () => { isCurrent = false }
  }, [isAuthenticatedUser])

  useEffect(() => {
    const refreshJoinBetaStatus = () => setHasSubmittedJoinBeta(window.localStorage.getItem('join-beta-submitted') === 'true')
    window.addEventListener('join-beta-submitted', refreshJoinBetaStatus)
    return () => window.removeEventListener('join-beta-submitted', refreshJoinBetaStatus)
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

    <header className="home2-header fixed inset-x-0 top-0 z-40 flex items-center justify-between" style={{ paddingInline: 'var(--pad-x)', paddingTop: 'var(--header-pt)', paddingBottom: 'var(--header-pb)' }}>
      <a className="transition-opacity hover:opacity-80" href="#hero-section" aria-label="LGPSM home" onClick={(event) => { event.preventDefault(); scrollToSection(document.getElementById('hero-section')) }}>
        <img src="/images/full-logo.svg" alt="LGPSM" className="home2-header-logo block h-auto w-[169px] max-w-[42vw]" />
      </a>
      <nav aria-label="Main navigation" className="home2-header-nav flex items-center font-medium uppercase tracking-[.2em]" style={{ gap: 'var(--gap-nav)', fontSize: 'var(--nav)' }}>
        {!hasSubmittedJoinBeta && <button type="button" onClick={openJoinBeta} className="home2-join-beta-button" aria-label="Join beta now"><Gift size={20} strokeWidth={1.5} aria-hidden="true" /><span>GET FREE CODE</span></button>}
        {isAuthenticatedUser && user ? (
          <div ref={accountMenuRef} className="home2-account-menu">
            <button type="button" className="home2-account-summary home2-account-summary-header" aria-label="Open account menu" aria-expanded={isAccountMenuOpen} aria-haspopup="menu" onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}>
              <Corner position="tl" />
              <Corner position="tr" />
              <Corner position="bl" />
              <Corner position="br" />
              <div className="home2-account-avatar" aria-hidden="true"><img src={getAvatarUrl(user)} alt="" /></div>
              <div className="home2-generation-balance" aria-label={`${freeGenerationsRemaining} generations remaining`}><GenerationIcon size={24} /><span>{freeGenerationsRemaining}</span></div>
            </button>
            {isAccountMenuOpen && <div className="home2-account-dropdown" role="menu" aria-label="Account menu">
              <div className="home2-account-item home2-plan-item">
                <PlanIcon />
                <span className="home2-plan-info"><strong>{user.email}</strong><small>Free plan</small></span>
                <button type="button" className="home2-account-upgrade" onClick={() => onOpenPaywall('studio')}>Upgrade</button>
              </div>
              <button type="button" className="home2-account-item" role="menuitem" onClick={scrollToTryOn}><span><GenerationIcon />Generation</span></button>
              <PromoCodeRedeemer onRedeemed={({ remaining }) => { setFreeGenerationsRemaining(remaining) }} onTryNow={scrollToTryOn} />
              <button type="button" className="home2-account-item" role="menuitem" onClick={onOpenLibrary}><span><Images size={16} strokeWidth={1.5} />My library</span></button>
              <button type="button" className="home2-account-item" role="menuitem" onClick={onOpenAccount}><span><CircleUserRound size={16} strokeWidth={1.5} />Referral</span></button>
              <div className="home2-account-divider" />
              <button type="button" className="home2-account-item" role="menuitem" onClick={() => void onSignOut()}><span><LogOut size={16} strokeWidth={1.5} />Sign out</span></button>
            </div>}
          </div>
        ) : (
          <>
            <button type="button" onClick={scrollToTryOn} className="transition-opacity hover:opacity-50">TRY FREE</button>
            <button type="button" onClick={() => setIsLoginOpen(true)} aria-label="Sign in" title="Sign in" className="home2-profile grid place-items-center border border-gray-400 p-2 transition-colors hover:border-black hover:bg-black hover:text-white" style={{ borderRadius: 'var(--radius-control)' }}><UserRound size="var(--icon)" strokeWidth={1.5} /></button>
          </>
        )}
      </nav>
    </header>
    <main id="hero-section" className="relative z-10 flex min-h-screen flex-1 flex-col justify-between gap-10 lg:flex-row lg:items-center" style={{ paddingInline: 'var(--pad-x)', paddingBlock: 'var(--main-py)' }}>
      <section className="flex flex-col items-start"><div className="relative h-[var(--corner)] w-[var(--corner)]"><Corner position="tl" /></div><img src="/images/lgpsm-hero-logo.svg" alt="Future Forward Fashion" className="mt-[var(--section-gap)] block h-auto w-[min(34rem,82vw)]" /><p className="mt-[var(--section-gap)] max-w-[min(31rem,82vw)] font-body text-[var(--body)] leading-relaxed tracking-[.02em] text-gray-700">From imagination to stunning visuals in seconds. Create, edit, and restyle with effortless AI.</p><div className="relative mt-[var(--section-gap)] h-[var(--corner)] w-[var(--corner)]"><Corner position="bl" /></div><div className="mt-[var(--section-gap)] flex flex-wrap items-center" style={{ gap: 'var(--btn-gap)' }}>
        {!hasSubmittedJoinBeta && <button type="button" onClick={openJoinBeta} className="button-primary">GET FREE CODE <img className="hero-button-arrow-light" src="/images/hero-button-arrow.svg" alt="" aria-hidden="true" /></button>}
        <button type="button" onClick={scrollToTryOn} className="button-secondary">Try now <img src="/images/hero-button-arrow.svg" alt="" aria-hidden="true" /></button>
      </div></section>
      <button type="button" onClick={scrollToNextSection} className="relative self-end text-right transition-opacity hover:opacity-70" style={{ minWidth: 'var(--feature-min)', padding: 'var(--feature-pad)' }} aria-label="Explore core function"><Corner position="tl"/><Corner position="tr"/><Corner position="bl"/><Corner position="br"/><span className="flex flex-col items-end gap-4"><img src="/images/lgpsm-feature-icon.svg" alt="" className="block h-auto w-[var(--globe)]" /><span className="font-semibold uppercase tracking-[.18em]" style={{ fontSize: 'var(--body)', lineHeight: 1.65 }}>Explore core function</span></span></button>
    </main>
    <section ref={nextSectionRef} id="core-functions" className="core-functions-screen relative z-10 min-h-screen overflow-hidden" aria-labelledby="core-functions-title">
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
    {isLoginOpen && <LoginOverlay onClose={() => setIsLoginOpen(false)} onAuthenticated={(authenticatedUser) => { onAuthenticated(authenticatedUser); setIsLoginOpen(false) }} />}
    <Popup open={promoGenerationUpdate !== null} title="Redeem successful" titleId="home2-generation-update-title" onClose={() => setPromoGenerationUpdate(null)} className="app-popup-template home2-generation-popup">
      {promoGenerationUpdate && <>
        <div className="home2-generation-update-art"><img src="/images/reward-code-banner.png" alt="" /><img className="home2-generation-update-logo" src="/images/full-logo.svg" alt="" /></div>
        <div className="home2-generation-update-copy">
          <h2>Redeem<br />successful</h2>
          <p>You’ve been personally selected to take {promoGenerationUpdate.granted} generation time</p>
          <button type="button" className="button-primary" onClick={() => { setPromoGenerationUpdate(null); scrollToTryOn() }}>CONTINUE</button>
        </div>
      </>}
    </Popup>

  </div>
}

export { HomePage }
