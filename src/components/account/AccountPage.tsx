import { useEffect, useState } from 'react'
import './account-page.css'
import type { User } from '@supabase/supabase-js'
import { Check, Copy, QrCode } from 'lucide-react'
import { SiteHeader } from '../SiteHeader'
import { requestReferralHistory, requestReferralLeaderboard, requestReferralSummary, type ReferralHistoryItem, type ReferralLeaderboardItem, type ReferralSummary } from '../../lib/sivitai'

export type AccountPageProps = {
  user: User | null
  onBack: () => void
  onSignOut: () => Promise<void>
  onOpenJoinBeta: () => void
  onOpenLibrary: () => void
  onOpenFunction: (tool?: 'try-on' | 'magic-editor') => void
  onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => void
  onOpenAccount: () => void
  onAuthenticated: (user: User) => void
}

function AccountPage({ user, onBack, onSignOut, onOpenJoinBeta, onOpenLibrary, onOpenFunction, onOpenPaywall, onOpenAccount, onAuthenticated }: AccountPageProps) {
  const [referral, setReferral] = useState<ReferralSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardItem[]>([])
  const [history, setHistory] = useState<ReferralHistoryItem[]>([])
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(true)
  const [copied, setCopied] = useState(false)


  useEffect(() => {
    if (!user || user.is_anonymous) return
    let isCurrent = true

    // Load each panel independently so a broken optional report does not hide
    // the account's referral code and link.
    void requestReferralSummary()
      .then((summary) => { if (isCurrent) setReferral(summary) })
      .catch((requestError: unknown) => { if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to load referral details.') })
    void requestReferralLeaderboard()
      .then((items) => { if (isCurrent) setLeaderboard(items) })
      .catch(() => undefined)
    void requestReferralHistory()
      .then((items) => { if (isCurrent) setHistory(items) })
      .catch(() => undefined)

    return () => { isCurrent = false }
  }, [user])

  useEffect(() => {
    const reloadReferral = () => {
      if (!user || user.is_anonymous) return
      void requestReferralSummary().then(setReferral).catch(() => undefined)
      void requestReferralLeaderboard().then(setLeaderboard).catch(() => undefined)
      void requestReferralHistory().then(setHistory).catch(() => undefined)
    }
    window.addEventListener('referral-completed', reloadReferral)
    return () => window.removeEventListener('referral-completed', reloadReferral)
  }, [user])

  const referralLink = referral ? `${window.location.origin}/signup?ref=${encodeURIComponent(referral.referralCode)}` : ''
  const copyText = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  const copyReferralLink = async () => copyText(referralLink)

  return <div className="account-page">
    <div className="account-page-grid" aria-hidden="true" />
    <SiteHeader onOpenJoinBeta={onOpenJoinBeta} onOpenLibrary={onOpenLibrary} onOpenAccount={onOpenAccount} onOpenFunction={onOpenFunction} onOpenPaywall={onOpenPaywall} user={user} onSignOut={onSignOut} onAuthenticated={onAuthenticated} onLogoClick={onBack} />
    <main className="account-page-content">
      <section className="account-page-hero"><div><h1 className="account-page-title">Invite friends.<br />Get free<br />generations!</h1><p className="account-page-lead">Earn up to <strong>100 generations</strong> as a reward for every successful referral.</p></div><div className="account-page-hero-art" aria-hidden="true"><img className="account-page-reward-image" src="/images/account-reward.png" alt="" /></div></section>
      <section className="account-page-referral-panel">
        {error && <p className="account-page-error" role="alert">{error}</p>}
        <div className="account-page-referral-fields"><label>Referral code<div className="account-page-input"><input readOnly value={referral?.referralCode ?? 'Loading referral code…'} /><button type="button" onClick={() => void copyText(referral?.referralCode ?? '')} disabled={!referral} aria-label="Copy referral code"><Copy size={16} /></button></div></label><label className="account-page-link-field">Referral link<div className="account-page-input"><input readOnly value={referralLink || 'Loading referral link…'} /><button type="button" onClick={() => void copyReferralLink()} disabled={!referralLink} aria-label="Copy referral link">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div></label><div className="account-page-invite-actions"><button type="button" className="account-page-invite" onClick={() => void copyReferralLink()}>Invite friends</button><button type="button" className="account-page-qr" aria-label="QR code"><QrCode size={20} /></button></div></div>
        {showGuide && <div className="account-page-guide"><h3>How it works</h3><div className="account-page-steps"><div><span>↗</span><p>Share your referral code or link with friends.</p></div><div><span>+</span><p>Your friends sign up using your referral code.</p></div><div><span>◆</span><p>Receive bonus generations for every successful referral.</p></div></div><button type="button" className="account-page-hide-guide" onClick={() => setShowGuide(false)}>Hide guide　⌃</button></div>}
      </section>
      <section className="account-page-tables"><div><h2>Referral leaderboard</h2><div className="account-page-table-wrap"><table><thead><tr><th>Rank</th><th>Account</th><th>Total referrals</th></tr></thead><tbody>{leaderboard.map((item) => <tr key={`${item.rank}-${item.account}`}><td className={item.rank === 1 ? 'is-top' : ''}>#{item.rank}</td><td>{item.account}</td><td>{item.totalReferrals}</td></tr>)}</tbody></table></div></div><div><h2>Referral history</h2><div className="account-page-table-wrap"><table><thead><tr><th>Friend account</th><th>Joined</th><th>Status</th><th>My reward</th></tr></thead><tbody>{history.map((item) => <tr key={`${item.friendAccount}-${item.joinedAt}`}><td>{item.friendAccount}</td><td>{new Date(item.joinedAt).toLocaleDateString('en-US')}</td><td className={item.status === 'successful' ? 'is-success' : ''}>{item.status === 'successful' ? 'Successful' : 'Pending'}</td><td>{item.reward === null ? '--' : `${item.reward} generations`}</td></tr>)}</tbody></table></div></div></section>
    </main>
  </div>
}

export { AccountPage }
