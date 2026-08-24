import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { CircleUserRound, Gift, Images, LogOut, Sparkles, UserRound } from 'lucide-react'
import { Corner } from './ui/Corner'
import { LoginOverlay } from '../features/auth/LoginOverlay'
import { PromoCodeRedeemer } from './home/PromoCodeRedeemer'
import { getCurrentPackage, getFreeGenerationsRemaining, subscribeToFreeGenerationChanges } from '../lib/freeGeneration'
import { requestBillingSummary } from '../lib/sivitai'

type SiteHeaderProps = {
  onOpenJoinBeta: () => void
  onOpenLibrary: () => void
  onOpenAccount: () => void
  onOpenFunction: (tool?: 'try-on' | 'magic-editor', imageUrl?: string | null) => void
  onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => void
  user: User | null
  onSignOut: () => Promise<void>
  onAuthenticated: (user: User) => void
  onLogoClick?: () => void
}

function getAvatarUrl(user: User) {
  if (user.user_metadata.avatar_url) return String(user.user_metadata.avatar_url)
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.id)}&backgroundColor=e2e8f0,cbd5e1,fef3c7,fee2e2,dcfce7`
}

function SiteHeader({ onOpenJoinBeta, onOpenLibrary, onOpenAccount, onOpenFunction, onOpenPaywall, user, onSignOut, onAuthenticated, onLogoClick }: SiteHeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(() => window.location.hash.includes('type=recovery'))
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [freeGenerationsRemaining, setFreeGenerationsRemaining] = useState(() => getFreeGenerationsRemaining())
  const [currentPackage, setCurrentPackage] = useState(() => getCurrentPackage())
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const isAuthenticatedUser = Boolean(user && !user.is_anonymous)

  useEffect(() => {
    if (!isAuthenticatedUser) return
    let isCurrent = true
    void requestBillingSummary()
      .then(({ balance, package: packageName }) => {
        if (!isCurrent) return
        setFreeGenerationsRemaining(balance)
        if (packageName === 'One time' || packageName === 'Creator' || packageName === 'Studio') setCurrentPackage(packageName)
      })
      .catch(() => undefined)
    return () => { isCurrent = false }
  }, [isAuthenticatedUser])

  useEffect(() => {
    const syncFreeGenerations = () => {
      setFreeGenerationsRemaining(getFreeGenerationsRemaining())
      setCurrentPackage(getCurrentPackage())
    }
    return subscribeToFreeGenerationChanges(syncFreeGenerations)
  }, [])

  useEffect(() => {
    if (!isLoginOpen) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsLoginOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isLoginOpen])

  useEffect(() => {
    if (!isAccountMenuOpen) return
    const closeMenu = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsAccountMenuOpen(false) }
    window.addEventListener('mousedown', closeMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('mousedown', closeMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isAccountMenuOpen])

  const handleAuthenticated = (authenticatedUser: User) => {
    onAuthenticated(authenticatedUser)
    setIsLoginOpen(false)
  }

  return <>
    <header className="home2-header fixed inset-x-0 top-0 z-40 flex items-center justify-between" style={{ paddingInline: 'var(--pad-x)', paddingTop: 'var(--header-pt)', paddingBottom: 'var(--header-pb)' }}>
      <button type="button" className="home2-header-logo-button transition-opacity hover:opacity-80" onClick={onLogoClick} aria-label="LGPSM home">
        <img src="/images/full-logo.svg" alt="LGPSM" className="home2-header-logo block h-auto w-[169px] max-w-[42vw]" />
      </button>
      <nav aria-label="Main navigation" className="home2-header-nav flex items-center font-medium uppercase tracking-[.2em]" style={{ gap: 'var(--gap-nav)', fontSize: 'var(--nav)' }}>
        <button type="button" onClick={onOpenJoinBeta} className="home2-join-beta-button" aria-label="Join beta now"><Corner position="tl" /><Corner position="tr" /><Corner position="bl" /><Corner position="br" /><Gift size={20} strokeWidth={1.5} aria-hidden="true" /><span>JOIN BETA NOW</span></button>
        {isAuthenticatedUser && user ? (
          <div ref={accountMenuRef} className="home2-account-menu">
            <button type="button" className="home2-avatar-button" aria-label="Open account menu" aria-expanded={isAccountMenuOpen} aria-haspopup="menu" onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}><img src={getAvatarUrl(user)} alt="" /></button>
            {isAccountMenuOpen && <div className="home2-account-dropdown" role="menu" aria-label="Account menu">
              <div className="home2-account-summary"><div className="home2-account-avatar" aria-hidden="true"><img src={getAvatarUrl(user)} alt="" /></div><div className="home2-account-details"><span title={user.email}>{user.email}</span><div><small>{currentPackage ? `${currentPackage} package` : 'Free plan'}</small><button type="button" onClick={() => onOpenPaywall('studio')}>Upgrade</button></div></div></div>
              <button type="button" className="home2-account-item" role="menuitem" onClick={() => onOpenFunction('try-on')}><span><Sparkles size={16} strokeWidth={1.5} />Generation</span><strong><Sparkles size={10} strokeWidth={1.5} />{freeGenerationsRemaining}</strong></button>
              <PromoCodeRedeemer onRedeemed={({ remaining }) => setFreeGenerationsRemaining(remaining)} />
              <button type="button" className="home2-account-item" role="menuitem" onClick={onOpenLibrary}><span><Images size={16} strokeWidth={1.5} />My library</span></button>
              <button type="button" className="home2-account-item" role="menuitem" onClick={onOpenAccount}><span><CircleUserRound size={16} strokeWidth={1.5} />My account</span></button>
              <div className="home2-account-divider" />
              <button type="button" className="home2-account-item" role="menuitem" onClick={() => void onSignOut()}><span><LogOut size={16} strokeWidth={1.5} />Sign out</span></button>
            </div>}
          </div>
        ) : <><button type="button" onClick={() => onOpenFunction('try-on')} className="transition-opacity hover:opacity-50">TRY FREE</button><button type="button" onClick={() => setIsLoginOpen(true)} aria-label="Sign in" title="Sign in" className="home2-profile grid place-items-center rounded-full border border-gray-400 p-2 transition-colors hover:border-black hover:bg-black hover:text-white"><UserRound size="var(--icon)" strokeWidth={1.5} /></button></>}
      </nav>
    </header>
    {isLoginOpen && <LoginOverlay onClose={() => setIsLoginOpen(false)} onAuthenticated={handleAuthenticated} />}
  </>
}

export { SiteHeader }
