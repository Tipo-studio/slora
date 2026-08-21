import { useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { LoginOverlay } from '../auth/LoginOverlay'
import { SiteHeader } from '../../components/SiteHeader'
import { TryOnSection } from './TryOnSection'

function FunctionPage({ onBack, onOpenJoinBeta, onOpenLibrary, onOpenAccount, onOpenFunction, onOpenPaywall, onSignOut, user, onAuthenticated }: { onBack: () => void; onOpenJoinBeta: () => void; onOpenLibrary: () => void; onOpenAccount: () => void; onOpenFunction: (tool?: 'try-on' | 'magic-editor', imageUrl?: string | null) => void; onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => void; onSignOut: () => Promise<void>; user: User | null; onAuthenticated: (user: User) => void }) {
  const tryOnSectionRef = useRef<HTMLElement>(null)
  const [isLoginOpen, setIsLoginOpen] = useState(() => window.location.hash.includes('type=recovery'))
  const searchParams = new URLSearchParams(window.location.search)
  const requestedTool = searchParams.get('tool')
  const requestedImageUrl = searchParams.get('image')

  return <div className="function-page min-h-screen overflow-x-clip bg-white text-black">
    <SiteHeader onOpenJoinBeta={onOpenJoinBeta} onOpenLibrary={onOpenLibrary} onOpenAccount={onOpenAccount} onOpenFunction={onOpenFunction} onOpenPaywall={onOpenPaywall} user={user} onSignOut={onSignOut} onAuthenticated={onAuthenticated} onLogoClick={onBack} />
    <TryOnSection sectionRef={tryOnSectionRef} user={user} onRequestLogin={() => setIsLoginOpen(true)} onOpenPaywall={onOpenPaywall} initialTool={requestedTool === 'try-on' || requestedTool === 'magic-editor' ? requestedTool : undefined} initialImageUrl={requestedImageUrl} />
    {isLoginOpen && <LoginOverlay onClose={() => setIsLoginOpen(false)} onAuthenticated={(authenticatedUser) => { onAuthenticated(authenticatedUser); setIsLoginOpen(false) }} />}
  </div>
}

export { FunctionPage }
