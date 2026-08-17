import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomePage } from './components/home/HomePage'
import { JoinBetaPage } from './features/join-beta/JoinBetaPage'
import { LibraryPage } from './features/library/LibraryPage'
import { PaywallPage } from './features/paywall/PaywallPage'
import { LoginOverlay } from './features/auth/LoginOverlay'
import { clearTryOnSession, getPendingGuestGeneration } from './features/tryon/tryonSession'
import { supabase } from './lib/supabase'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [user, setUser] = useState<User | null>(null)
  const [isPaywallLoginOpen, setIsPaywallLoginOpen] = useState(false)
  const userIdRef = useRef<string | null>(null)

  const resetForUserTransition = (nextUser: User | null) => {
    const nextUserId = nextUser?.id ?? null
    if (userIdRef.current !== nextUserId) {
      const pendingGuestGeneration = getPendingGuestGeneration()
      const shouldResumeGuestGeneration = Boolean(nextUser && !nextUser.is_anonymous && pendingGuestGeneration)
      clearTryOnSession()
      setIsPaywallLoginOpen(false)
      window.history.replaceState({}, '', shouldResumeGuestGeneration ? '/?resume=guest-generation' : '/')
      setPath('/')
      userIdRef.current = nextUserId
    }
    setUser(nextUser)
  }

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null
      setUser(data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => resetForUserTransition(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(window.location.pathname)
  }

  const openJoinBeta = () => navigate('/join-beta')
  const closeJoinBeta = () => navigate('/')

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (path === '/join-beta') return <JoinBetaPage onBack={closeJoinBeta} />
  if (path === '/library') return <LibraryPage user={user} onBack={() => navigate('/')} onOpenTool={(tool, imageUrl) => navigate(`/?tool=${tool}&image=${encodeURIComponent(imageUrl)}`)} />
  if (path === '/paywall') {
    const searchParams = new URLSearchParams(window.location.search)
    const initialPlan = searchParams.get('plan')
    const returnToResult = searchParams.get('return') === 'tryon-result'
    return <>
      <PaywallPage onBack={() => navigate(returnToResult ? '/?return=tryon-result' : '/')} onPurchaseComplete={() => navigate(returnToResult ? '/?return=tryon-result' : '/')} initialPlan={initialPlan === 'one-time' || initialPlan === 'creator' || initialPlan === 'studio' ? initialPlan : undefined} user={user} onRequestLogin={() => setIsPaywallLoginOpen(true)} />
      {isPaywallLoginOpen && <LoginOverlay onClose={() => setIsPaywallLoginOpen(false)} onAuthenticated={resetForUserTransition} />}
    </>
  }
  return <HomePage onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenPaywall={(plan: 'one-time' | 'creator' | 'studio', returnToResult = false) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`)} user={user} onSignOut={signOut} onAuthenticated={resetForUserTransition} />
}

export default App
