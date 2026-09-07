import { useEffect, useState } from 'react'
import './account-page.css'
import type { User } from '@supabase/supabase-js'
import { Check, CheckCircle2, Copy, XCircle } from 'lucide-react'
import { SiteHeader } from '../SiteHeader'
import { Popup } from '../ui/Popup'
import { requestReferralHistory, requestReferralLeaderboard, requestReferralSummary, type ReferralHistoryItem, type ReferralLeaderboardItem, type ReferralSummary } from '../../lib/sivitai'
import { clearPendingReferralCode, setPendingReferralCode } from '../../lib/referral'
import { completePendingReferral } from '../../lib/referralService'

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
  const [referralCodeInput, setReferralCodeInput] = useState('')

  const [isApplyingReferralCode, setIsApplyingReferralCode] = useState(false)
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
  const [applyCodeResult, setApplyCodeResult] = useState<{ success: boolean; message: string } | null>(null)


  useEffect(() => {
    document.title = 'Referral'
    return () => { document.title = 'LGPSM' }
  }, [])

  useEffect(() => {
    const previewState = new URLSearchParams(window.location.search).get('preview-apply')
    if (previewState === 'success') setApplyCodeResult({ success: true, message: 'Referral code applied. Free generations added.' })
    if (previewState === 'error') setApplyCodeResult({ success: false, message: 'This code is invalid or has already been used.' })
  }, [])

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
  const shareLink = (platform: 'facebook' | 'instagram' | 'x') => {
    if (!referralLink) return
    const shareText = 'Create stunning visuals with me on LGPSM.'
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      instagram: `https://www.instagram.com/?url=${encodeURIComponent(referralLink)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`,
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }
  const applyReferralCode = async () => {
    const code = setPendingReferralCode(referralCodeInput)
    if (!code) {
      setApplyCodeResult({ success: false, message: 'Enter a referral code.' })
      return
    }
    if (!user || user.is_anonymous) {
      setApplyCodeResult({ success: false, message: 'Sign in to apply a referral code.' })
      return
    }

    setIsApplyingReferralCode(true)
    setApplyCodeResult(null)
    try {
      const completed = await completePendingReferral(user.id)
      if (!completed) {
        clearPendingReferralCode()
        setApplyCodeResult({ success: false, message: 'This code is invalid or has already been used.' })
        return
      }
      setReferralCodeInput('')
      setApplyCodeResult({ success: true, message: 'Referral code applied. Free generations added.' })
    } catch (applyError: unknown) {
      setApplyCodeResult({ success: false, message: applyError instanceof Error ? applyError.message : 'Unable to apply this referral code.' })
    } finally {
      setIsApplyingReferralCode(false)
    }
  }

  return <div className="account-page" data-page-title="Referral">
    <div className="account-page-grid" aria-hidden="true" />
    <SiteHeader onOpenJoinBeta={onOpenJoinBeta} onOpenLibrary={onOpenLibrary} onOpenAccount={onOpenAccount} onOpenFunction={onOpenFunction} onOpenPaywall={onOpenPaywall} user={user} onSignOut={onSignOut} onAuthenticated={onAuthenticated} onLogoClick={onBack} />
    <main className="account-page-content">
      <section className="account-page-hero"><div><h1 className="account-page-title">Invite friends.<br />Get free<br />generations!</h1><p className="account-page-lead">Earn up to <strong>100 generations</strong> as a reward for every successful referral.</p></div><div className="account-page-hero-art" aria-hidden="true"><img className="account-page-reward-image" src="/images/account-reward.png" alt="" /></div></section>
      <section className="account-page-referral-panel">
        {error && <p className="account-page-error" role="alert">{error}</p>}
        <div className="account-page-referral-fields"><label>Your referral code<div className="account-page-input"><input readOnly value={referral?.referralCode ?? 'Loading referral code…'} /><button type="button" onClick={() => void copyText(referral?.referralCode ?? '')} disabled={!referral} aria-label="Copy referral code"><Copy size={16} /></button></div></label><label className="account-page-link-field">Referral link<div className="account-page-input"><input readOnly value={referralLink || 'Loading referral link…'} /><button type="button" onClick={() => void copyReferralLink()} disabled={!referralLink} aria-label="Copy referral link">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div></label><div className="account-page-invite-actions"><button type="button" className="account-page-invite" onClick={() => setIsSharePopupOpen(true)} disabled={!referralLink}>Invite friends</button></div></div>
        <div className="account-page-apply-code">
          <div><h2>Have a referral code?</h2><p>Apply a friend’s code to receive your bonus generations.</p></div>
          <div className="account-page-apply-code-form"><label htmlFor="account-referral-code">Referral code</label><div className="account-page-input"><input id="account-referral-code" value={referralCodeInput} onChange={(event) => setReferralCodeInput(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void applyReferralCode() } }} placeholder="Enter code" maxLength={40} autoComplete="off" disabled={isApplyingReferralCode} /><button type="button" onClick={() => void applyReferralCode()} disabled={isApplyingReferralCode}>{isApplyingReferralCode ? 'APPLYING…' : 'APPLY'}</button></div></div>
        </div>
        {showGuide && <div className="account-page-guide"><h3>How it works</h3><div className="account-page-steps"><div><span>↗</span><p>Share your referral code or link with friends.</p></div><div><span>+</span><p>Your friends sign up using your referral code.</p></div><div><span>◆</span><p>Receive bonus generations for every successful referral.</p></div></div><button type="button" className="account-page-hide-guide" onClick={() => setShowGuide(false)}>Hide guide　⌃</button></div>}
      </section>
      <section className="account-page-tables"><div><h2>Referral leaderboard</h2><div className="account-page-table-wrap"><table><thead><tr><th>Rank</th><th>Account</th><th>Total referrals</th></tr></thead><tbody>{leaderboard.map((item) => <tr key={`${item.rank}-${item.account}`}><td className={item.rank === 1 ? 'is-top' : ''}>#{item.rank}</td><td>{item.account}</td><td>{item.totalReferrals}</td></tr>)}</tbody></table></div></div><div><h2>Referral history</h2><div className="account-page-table-wrap"><table><thead><tr><th>Friend account</th><th>Joined</th><th>Status</th><th>My reward</th></tr></thead><tbody>{history.map((item) => <tr key={`${item.friendAccount}-${item.joinedAt}`}><td>{item.friendAccount}</td><td>{new Date(item.joinedAt).toLocaleDateString('en-US')}</td><td className={item.status === 'successful' ? 'is-success' : ''}>{item.status === 'successful' ? 'Successful' : 'Pending'}</td><td>{item.reward === null ? '--' : `${item.reward} generations`}</td></tr>)}</tbody></table></div></div></section>
    </main>
    <Popup open={isSharePopupOpen} title="Share referral link" titleId="account-share-referral-title" onClose={() => setIsSharePopupOpen(false)} className="app-popup-template account-share-popup">
          <div className="app-popup-art home2-promo-art" aria-hidden="true"><img src="/images/reward-code-banner.png" alt="" /></div>
          <div className="app-popup-form home2-promo-form account-share-content"><p>Share your referral link with friends and earn free generations.</p><div className="account-share-link"><input readOnly value={referralLink} aria-label="Referral link to share" /><button type="button" onClick={() => void copyReferralLink()}>{copied ? 'COPIED' : 'COPY'}</button></div><div className="account-share-options"><button type="button" onClick={() => shareLink('facebook')} aria-label="Share on Facebook"><span className="account-share-icon account-share-icon-facebook">f</span><strong>Facebook</strong></button><button type="button" onClick={() => shareLink('instagram')} aria-label="Share on Instagram"><span className="account-share-icon account-share-icon-instagram">◎</span><strong>Instagram</strong></button><button type="button" onClick={() => shareLink('x')} aria-label="Share on X"><span className="account-share-icon">𝕏</span><strong>X</strong></button></div></div>
        </Popup>
        <Popup open={applyCodeResult !== null} title={applyCodeResult?.success ? 'Referral code applied' : 'Unable to apply code'} titleId="account-apply-code-result-title" onClose={() => setApplyCodeResult(null)} icon={applyCodeResult?.success ? <CheckCircle2 size={48} strokeWidth={1.5} color="#10b981" /> : <XCircle size={48} strokeWidth={1.5} color="#dc2626" />} className={`app-popup-template account-apply-code-result-popup ${applyCodeResult?.success ? 'is-success' : 'is-error'}`}>
          <div className="app-popup-art home2-promo-art" aria-hidden="true"><img src="/images/reward-code-banner.png" alt="" /></div>
          <div className="app-popup-form home2-promo-form account-apply-code-result-content"><p role="status">{applyCodeResult?.message}</p><button type="button" onClick={() => setApplyCodeResult(null)}>CLOSE</button></div>
        </Popup>
  </div>
}

export { AccountPage }
