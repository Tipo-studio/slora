import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomePage } from './components/home/HomePage'
import { JoinBetaPage } from './features/join-beta/JoinBetaPage'
import { supabase } from './lib/supabase'

function App() {
  const [isJoinBetaPage, setIsJoinBetaPage] = useState(() => window.location.pathname === '/join-beta')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onPopState = () => setIsJoinBetaPage(window.location.pathname === '/join-beta')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const openJoinBeta = () => {
    window.history.pushState({}, '', '/join-beta')
    setIsJoinBetaPage(true)
  }

  const closeJoinBeta = () => {
    window.history.pushState({}, '', '/')
    setIsJoinBetaPage(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return isJoinBetaPage
    ? <JoinBetaPage onBack={closeJoinBeta} />
    : <HomePage onOpenJoinBeta={openJoinBeta} user={user} onSignOut={signOut} />
}

export default App
