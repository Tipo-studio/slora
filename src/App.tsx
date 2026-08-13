import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomePage } from './components/home/HomePage'
import { JoinBetaPage } from './features/join-beta/JoinBetaPage'
import { LibraryPage } from './features/library/LibraryPage'
import { PaywallPage } from './features/paywall/PaywallPage'
import { supabase } from './lib/supabase'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
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
    const initialPlan = new URLSearchParams(window.location.search).get('plan')
    return <PaywallPage onBack={() => navigate('/')} initialPlan={initialPlan === 'one-time' || initialPlan === 'creator' || initialPlan === 'studio' ? initialPlan : undefined} />
  }
  return <HomePage onOpenJoinBeta={openJoinBeta} onOpenLibrary={() => navigate('/library')} onOpenPaywall={(plan: 'one-time' | 'creator' | 'studio') => navigate(`/paywall?plan=${plan}`)} user={user} onSignOut={signOut} onAuthenticated={setUser} />
}

export default App
