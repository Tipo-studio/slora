import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomePage } from './components/home/HomePage'
import { AccountPage } from './components/account/AccountPage'
import { JoinBetaPage } from './features/join-beta/JoinBetaPage'
import { LibraryPage } from './features/library/LibraryPage'
import { PaywallPage } from './features/paywall/PaywallPage'
import { LoginOverlay } from './features/auth/LoginOverlay'
import { Popup } from './components/ui/Popup'
import { clearTryOnSession, getPendingGuestGeneration } from './features/tryon/tryonSession'
import { getCurrentUser, supabase } from './lib/supabase'
import { captureReferralCodeFromUrl } from './lib/referral'
import { completePendingReferral } from './lib/referralService'

const FunctionPage = lazy(() => import('./features/tryon/FunctionPage').then(({ FunctionPage }) => ({ default: FunctionPage })))

function FunctionPageFallback() {
  return <div className="function-page min-h-screen bg-white text-black" aria-busy="true"><div className="home2-header function-page-header"><div className="paywall-home"><img src="/images/full-logo.svg" alt="LGPSM" /></div></div><main className="grid min-h-[70vh] place-items-center px-6"><p className="font-jakarta text-sm uppercase tracking-[.18em] text-gray-500">Loading function…</p></main></div>
}

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [user, setUser] = useState<User | null>(null)
  const [isPaywallLoginOpen, setIsPaywallLoginOpen] = useState(false)
  const [isSignupSuccessOpen, setIsSignupSuccessOpen] = useState(false)
  const userIdRef = useRef<string | null>(null)

  const resetForUserTransition = (nextUser: User | null) => {
    const nextUserId = nextUser?.id ?? null
    if (userIdRef.current !== nextUserId) {
      if (nextUser && !nextUser.is_anonymous) void completePendingReferral(nextUser.id).catch(() => undefined)
      const pendingGuestGeneration = getPendingGuestGeneration()
      const shouldResumeGuestGeneration = Boolean(nextUser && !nextUser.is_anonymous && pendingGuestGeneration)
      const shouldStayOnJoinBeta = window.location.pathname === '/join-beta'
      clearTryOnSession()
      setIsPaywallLoginOpen(false)
      const nextPath = shouldResumeGuestGeneration ? '/?resume=guest-generation' : shouldStayOnJoinBeta ? '/join-beta' : '/'
      window.history.replaceState({}, '', nextPath)
      setPath(nextPath.split('?')[0])
      userIdRef.current = nextUserId
    }
    setUser(nextUser)
  }

  useEffect(() => {
    captureReferralCodeFromUrl()
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const queryParams = new URLSearchParams(window.location.search)
    const isSignupConfirmationCallback = (queryParams.has('code') && window.location.pathname === '/signup')
      || hashParams.get('type') === 'signup'
      || hashParams.get('type') === 'email'
      || hashParams.has('access_token')
    const isOAuthCallbackOnAppRoute = queryParams.has('code') && window.location.pathname !== '/signup'

    // Google OAuth can return to the home route, where LoginOverlay is not
    // mounted. Exchange the PKCE code here so the callback works globally.
    if (isOAuthCallbackOnAppRoute) {
      void supabase.auth.exchangeCodeForSession(queryParams.get('code')!).then(({ error }) => {
        if (error) throw error
        window.history.replaceState({}, '', window.location.pathname)
        return getCurrentUser()
      }).then((currentUser) => {
        userIdRef.current = currentUser?.id ?? null
        setUser(currentUser)
      }).catch(() => {
        userIdRef.current = null
        setUser(null)
      })
    } else if (isSignupConfirmationCallback) {
      // The signup overlay owns email confirmation callbacks.
      userIdRef.current = null
      setUser(null)
    } else {
      void getCurrentUser().then(async (currentUser) => {
        if (currentUser?.email && !currentUser.email_confirmed_at) {
          userIdRef.current = null
          setUser(null)
          await supabase.auth.signOut()
          return
        }
        if (currentUser && !currentUser.is_anonymous) await completePendingReferral(currentUser.id).catch(() => undefined)
        userIdRef.current = currentUser?.id ?? null
        setUser(currentUser)
      }).catch(() => {
        userIdRef.current = null
        setUser(null)
      })
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const queryParams = new URLSearchParams(window.location.search)
      const isSignupConfirmationCallback = (queryParams.has('code') && window.location.pathname === '/signup')
        || hashParams.get('type') === 'signup'
        || hashParams.get('type') === 'email'
        || hashParams.has('access_token')

      // LoginOverlay owns the confirmation callback. Do not let the temporary
      // callback session redirect the user into the app before it signs out.
      if (isSignupConfirmationCallback) return

      if (event === 'INITIAL_SESSION') {
        const initialUser = session?.user ?? null
        if (initialUser?.email && !initialUser.email_confirmed_at) {
          // Supabase can briefly expose a signup session before confirmation.
          // Never hydrate the app with that unconfirmed user.
          userIdRef.current = null
          setUser(null)
          void supabase.auth.signOut()
          return
        }
        if (initialUser && !initialUser.is_anonymous) void completePendingReferral(initialUser.id).catch(() => undefined)
        userIdRef.current = initialUser?.id ?? null
        setUser(initialUser)
        return
      }

      const nextUser = session?.user ?? null
      if (nextUser?.email && !nextUser.email_confirmed_at) {
        // Guard against SIGNED_IN emitted immediately after signup.
        userIdRef.current = null
        setUser(null)
        void supabase.auth.signOut()
        return
      }
      resetForUserTransition(nextUser)
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

  const headerProps = { onOpenJoinBeta: openJoinBeta, onOpenLibrary: () => navigate('/library'), onOpenAccount: openAccount, onOpenFunction: openFunction, onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`), onSignOut: signOut, onAuthenticated: resetForUserTransition }

  if (path === '/join-beta') return <><JoinBetaPage {...headerProps} onBack={closeJoinBeta} user={user} onRequestLogin={() => setIsPaywallLoginOpen(true)} />{isPaywallLoginOpen && <LoginOverlay onClose={() => setIsPaywallLoginOpen(false)} onAuthenticated={resetForUserTransition} />}</>
  if (path === '/signup') return <><HomePage onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenAccount={openAccount} onOpenFunction={(tool) => openFunction(tool)} onOpenPaywall={(plan: 'one-time' | 'creator' | 'studio', returnToResult = false) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`)} user={user} onSignOut={signOut} onAuthenticated={resetForUserTransition} /><LoginOverlay onClose={() => navigate('/')} onAuthenticated={resetForUserTransition} onSignupCompleted={() => setIsSignupSuccessOpen(true)} initialMode="sign-up" /><Popup open={isSignupSuccessOpen} title="Signup successful" description="Your account is ready to use." onClose={() => setIsSignupSuccessOpen(false)} className="app-popup-template signup-success-popup"><div className="signup-success-content"><strong>2 free generations are ready to start.</strong><p>Use your free generations to create your first images.</p><button type="button" className="button-primary" onClick={() => setIsSignupSuccessOpen(false)}>START CREATING</button></div></Popup></>
  if (path === '/account') return <AccountPage user={user} onBack={() => navigate('/')} onSignOut={signOut} onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenFunction={(tool) => openFunction(tool)} onOpenPaywall={(plan, returnToResult = false) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`)} onOpenAccount={openAccount} onAuthenticated={resetForUserTransition} />
  if (path === '/library') return <LibraryPage {...headerProps} user={user} onBack={() => navigate('/')} onOpenTool={(tool, imageUrl) => navigate(`/function?tool=${tool}&image=${encodeURIComponent(imageUrl)}`)} />

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
      <PaywallPage {...headerProps} onBack={() => navigate(returnToResult ? '/?return=tryon-result' : '/')} initialPlan={initialPlan === 'one-time' || initialPlan === 'creator' || initialPlan === 'studio' ? initialPlan : undefined} user={user} onRequestLogin={() => setIsPaywallLoginOpen(true)} />
      {isPaywallLoginOpen && <LoginOverlay onClose={() => setIsPaywallLoginOpen(false)} onAuthenticated={resetForUserTransition} />}
    </>
  }
  return <HomePage onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenAccount={openAccount} onOpenFunction={(tool) => openFunction(tool)} onOpenPaywall={(plan: 'one-time' | 'creator' | 'studio', returnToResult = false) => navigate(`/paywall?plan=${plan}${returnToResult ? '&return=tryon-result' : ''}`)} user={user} onSignOut={signOut} onAuthenticated={resetForUserTransition} />
}

export default App
