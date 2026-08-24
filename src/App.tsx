import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomePage } from './components/home/HomePage'
import { AccountPage } from './components/account/AccountPage'
import { JoinBetaPage } from './features/join-beta/JoinBetaPage'
import { LibraryPage } from './features/library/LibraryPage'
import { PaywallPage } from './features/paywall/PaywallPage'
import { LoginOverlay } from './features/auth/LoginOverlay'
import { clearTryOnSession, getPendingGuestGeneration } from './features/tryon/tryonSession'
import { supabase } from './lib/supabase'

const FunctionPage = lazy(() => import('./features/tryon/FunctionPage').then(({ FunctionPage }) => ({ default: FunctionPage })))

function FunctionPageFallback() {
  return <div className="function-page min-h-screen bg-white text-black" aria-busy="true"><div className="paywall-header function-page-header"><div className="paywall-home"><img src="/images/full-logo.svg" alt="LGPSM" /></div></div><main className="grid min-h-[70vh] place-items-center px-6"><p className="font-jakarta text-sm uppercase tracking-[.18em] text-gray-500">Loading function…</p></main></div>
}

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        userIdRef.current = session?.user?.id ?? null
        setUser(session?.user ?? null)
        return
      }
      resetForUserTransition(session?.user ?? null)
    })
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
  const openAccount = () => navigate('/account')
  const openFunction = (tool?: 'try-on' | 'magic-editor', imageUrl?: string | null) => navigate(`/function${tool ? `?tool=${tool}${imageUrl ? `&image=${encodeURIComponent(imageUrl)}` : ''}` : ''}`)
  const closeJoinBeta = () => navigate('/')

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (path === '/join-beta') return <JoinBetaPage onBack={closeJoinBeta} />
  if (path === '/account') return <AccountPage user={user} onBack={() => navigate('/')} onSignOut={signOut} onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenFunction={(tool) => openFunction(tool)} onOpenPaywall={(plan, returnToResult = false) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`)} onOpenAccount={openAccount} onAuthenticated={resetForUserTransition} />
  if (path === '/library') return <LibraryPage user={user} onBack={() => navigate('/')} onOpenTool={(tool, imageUrl) => navigate(`/function?tool=${tool}&image=${encodeURIComponent(imageUrl)}`)} />
  if (path === '/function') {
    const searchParams = new URLSearchParams(window.location.search)
    const returnToResult = searchParams.get('return') === 'tryon-result'
    return <Suspense fallback={<FunctionPageFallback />}><FunctionPage onBack={() => navigate(returnToResult ? '/?return=tryon-result' : '/')} onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenAccount={openAccount} onOpenFunction={openFunction} onOpenPaywall={(plan, shouldReturn = false) => navigate(`/paywall?plan=${plan}${shouldReturn || returnToResult ? '&return=tryon-result' : ''}`)} onSignOut={signOut} user={user} onAuthenticated={resetForUserTransition} /></Suspense>
  }
  if (path === '/paywall') {
    const searchParams = new URLSearchParams(window.location.search)
    const initialPlan = searchParams.get('plan')
    const returnToResult = searchParams.get('return') === 'tryon-result'
    return <>
      <PaywallPage onBack={() => navigate(returnToResult ? '/?return=tryon-result' : '/')} initialPlan={initialPlan === 'one-time' || initialPlan === 'creator' || initialPlan === 'studio' ? initialPlan : undefined} user={user} onRequestLogin={() => setIsPaywallLoginOpen(true)} />
      {isPaywallLoginOpen && <LoginOverlay onClose={() => setIsPaywallLoginOpen(false)} onAuthenticated={resetForUserTransition} />}
    </>
  }
  return <HomePage onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenAccount={openAccount} onOpenFunction={(tool) => openFunction(tool)} onOpenPaywall={(plan: 'one-time' | 'creator' | 'studio', returnToResult = false) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`)} user={user} onSignOut={signOut} onAuthenticated={resetForUserTransition} />
}

export default App
