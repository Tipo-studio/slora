import { useEffect, useState } from 'react'
import { HomePage } from './components/home/HomePage'
import { JoinBetaPage } from './features/join-beta/JoinBetaPage'

function App() {
  const [isJoinBetaPage, setIsJoinBetaPage] = useState(() => window.location.pathname === '/join-beta')

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

  return isJoinBetaPage
    ? <JoinBetaPage onBack={closeJoinBeta} />
    : <HomePage onOpenJoinBeta={openJoinBeta} />
}

export default App
