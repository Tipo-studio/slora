import { useState } from 'react'
import { SiteHeader, type SiteHeaderProps } from '../../components/SiteHeader'
import { ImageRevealBackground } from '../../components/home/ImageRevealBackground'
import { PromoCodeRedeemer } from '../../components/home/PromoCodeRedeemer'
import { CoreInteractiveGrid } from '../core/CoreInteractiveGrid'

type PaywallPageProps = SiteHeaderProps & { onBack: () => void; initialPlan?: 'one-time' | 'creator' | 'studio'; onRequestLogin: () => void }

function PaywallPage({ onBack, user, onRequestLogin, ...headerProps }: PaywallPageProps) {
  const [message, setMessage] = useState('')
  const [generationBalance, setGenerationBalance] = useState<number | null>(null)

  return <main className="paywall-page">
    <ImageRevealBackground />
    <CoreInteractiveGrid />
    <SiteHeader {...headerProps} user={user} onLogoClick={onBack} />
    <section className="paywall-intro">
      <h1>Get 20 free<br />generations</h1>
      <p>Payment is temporarily unavailable. Use a promotion code to add generations to your account.</p>
    </section>
    <section className="paywall-plans" aria-label="Promotion code">
      <article className="paywall-plan paywall-plan-creator is-selected">
        <div className="paywall-plan-main"><div className="paywall-plan-heading"><h2>Promotion code</h2><div className="paywall-price"><strong>+20</strong><span>/ generations</span></div><div className="paywall-credit">Enter your code below to claim your free generations.</div></div></div>
        {!user || user.is_anonymous ? <button type="button" className="paywall-continue" onClick={onRequestLogin}>Sign in to receive code</button> : <PromoCodeRedeemer onRedeemed={({ granted, remaining }) => { setGenerationBalance(remaining); setMessage(`${granted} generations added to your account. You now have ${remaining} generations remaining.`) }} />}
      </article>
    </section>
    {message && <p className="paywall-purchase-message" role="status">{message}</p>}
    {generationBalance !== null && <p className="paywall-purchase-message" role="status">Generation balance: {generationBalance}</p>}
  </main>
}

export { PaywallPage }
