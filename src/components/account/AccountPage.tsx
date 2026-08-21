import { useEffect, useState } from 'react'
import './account-page.css'
import type { User } from '@supabase/supabase-js'
import { Check, Copy, Gift, Sparkles, UserRound } from 'lucide-react'
import { requestReferralSummary, type ReferralSummary } from '../../lib/sivitai'
import { SiteHeader } from '../SiteHeader'

type AccountPageProps = {
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
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user || user.is_anonymous) return
    let isCurrent = true
    void requestReferralSummary()
      .then((summary) => { if (isCurrent) setReferral(summary) })
      .catch((requestError: unknown) => { if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to load referral details.') })
    return () => { isCurrent = false }
  }, [user])

  const referralLink = referral ? `${window.location.origin}/?ref=${encodeURIComponent(referral.referralCode)}` : ''
  const copyReferralLink = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <div className="account-page min-h-screen bg-white text-black">
    <SiteHeader onOpenJoinBeta={onOpenJoinBeta} onOpenLibrary={onOpenLibrary} onOpenAccount={onOpenAccount} onOpenFunction={onOpenFunction} onOpenPaywall={onOpenPaywall} user={user} onSignOut={onSignOut} onAuthenticated={onAuthenticated} onLogoClick={onBack} />
    <main className="account-page-content mx-auto max-w-5xl px-[var(--pad-x)] pb-16 pt-32">
      <div className="account-page-eyebrow"><Sparkles size={14} /> MY ACCOUNT</div>
      <h1 className="account-page-title">Your creative account</h1>
      <p className="account-page-lead">Manage your profile and invite friends to earn bonus generations together.</p>

      <section className="mt-12 grid gap-5 md:grid-cols-[1.1fr_.9fr]">
        <article className="account-page-card">
          <div className="account-page-card-icon"><UserRound size={22} /></div>
          <p className="mt-6 text-xs uppercase tracking-[.18em] text-gray-500">Signed in as</p>
          <h2 className="mt-2 break-all text-xl font-semibold">{user?.email ?? 'Account'}</h2>
          <p className="mt-3 text-sm text-gray-600">Your account is ready for generations, credits and referrals.</p>
        </article>
        <article className="account-page-card account-page-referral-card">
          <div className="account-page-card-icon"><Gift size={22} /></div>
          <p className="mt-6 text-xs uppercase tracking-[.18em] text-gray-500">Referral rewards</p>
          <h2 className="mt-2 text-xl font-semibold">Invite friends</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">You and your friend receive 10 generations when they create an account.</p>
          {error ? <p className="mt-5 text-sm text-red-600" role="alert">{error}</p> : <>
            <div className="mt-5 flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-2">
              <code className="min-w-0 flex-1 truncate px-2 text-sm">{referral?.referralCode ?? 'Loading referral code…'}</code>
              <button type="button" className="account-page-copy" onClick={() => void copyReferralLink()} disabled={!referralLink} aria-label="Copy referral link">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded border border-gray-200 p-3"><strong className="block text-2xl">{referral?.successfulReferrals ?? 0}</strong><span className="text-xs text-gray-500">Successful referrals</span></div>
              <div className="rounded border border-gray-200 p-3"><strong className="block text-2xl">{referral?.bonusGenerations ?? 0}</strong><span className="text-xs text-gray-500">Bonus generations</span></div>
            </div>
          </>}
        </article>
      </section>
    </main>
  </div>
}

export { AccountPage }
