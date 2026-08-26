import { useState } from 'react'
import { SiteHeader, type SiteHeaderProps } from '../../components/SiteHeader'
import { ImageRevealBackground } from '../../components/home/ImageRevealBackground'
import { PromoCodeRedeemer } from '../../components/home/PromoCodeRedeemer'
import { CoreInteractiveGrid } from '../core/CoreInteractiveGrid'

type PaywallPageProps = SiteHeaderProps & { onBack: () => void; initialPlan?: 'one-time' | 'creator' | 'studio'; onRequestLogin: () => void }

function PaywallPage({ onBack, user, onRequestLogin, ...headerProps }: PaywallPageProps) {
  const [message, setMessage] = useState('')

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
        {!user || user.is_anonymous ? <button type="button" className="paywall-continue" onClick={onRequestLogin}>Sign in to receive code</button> : <PromoCodeRedeemer onRedeemed={({ granted }) => setMessage(`${granted} generations added to your account.`)} />}
      </article>
    </section>
    {message && <p className="paywall-purchase-message" role="status">{message}</p>}
  </main>
}

export { PaywallPage }
