import { useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { ImageRevealBackground } from '../../components/home/ImageRevealBackground'
import { addPurchasedGenerations } from '../../lib/freeGeneration'
import { CoreInteractiveGrid } from '../core/CoreInteractiveGrid'

type Plan = {
  name: string
  price: string
  generations: number
  credits: string
  included: string[]
  unavailable: string[]
  studioFeature?: string
}

const plans: Plan[] = [
  {
    name: 'One time',
    price: '$4.99',
    generations: 5,
    credits: '5 Generation ~ $0.99 each',
    included: ['Everything Included', 'Results per Generation up to 2', 'HD Unlock'],
    unavailable: ['Unlimited History', 'Batch Generation', 'Bulk try-on', 'Queue priority'],
  },
  {
    name: 'Creator',
    price: '$9.99',
    generations: 300,
    credits: '300 Generations ~ $0.03 each',
    included: ['Everything Included', 'Results per Generation 2–4', 'HD Unlock', '1 month History'],
    unavailable: ['Batch Generation', 'Bulk try-on', 'Queue priority'],
  },
  {
    name: 'Studio',
    price: '$19.99',
    generations: 700,
    credits: '700 Generations ~ $0.03 each',
    included: ['Everything Included', 'Results per Generation up to 8', 'HD Unlock', 'Unlimited History', 'Batch Generation', 'Bulk try-on', 'Queue priority'],
    unavailable: [],
    studioFeature: 'Custome prompt',
  },
]

function PlanFeature({ children, unavailable = false, studio = false }: { children: string; unavailable?: boolean; studio?: boolean }) {
  const icon = studio ? '/images/paywall/check-studio.svg' : unavailable ? '/images/paywall/check-disabled.svg' : '/images/paywall/check-included.svg'
  return <li className={`paywall-feature ${unavailable ? 'is-unavailable' : ''}`}>
    <img src={icon} alt="" aria-hidden="true" />
    <span>{children}</span>
  </li>
}

function PlanCard({ plan, billingPeriod, onSelect }: { plan: Plan; billingPeriod: 'monthly' | 'annual'; onSelect: (plan: Plan) => void }) {
  const monthlyPrice = Number.parseFloat(plan.price.slice(1))
  const price = billingPeriod === 'annual' ? monthlyPrice * .7 : monthlyPrice
  const formattedPrice = `$${price.toFixed(2)}`
  return <article className={`paywall-plan paywall-plan-${plan.name.toLowerCase().replace(' ', '-')}`}>
    <div className="paywall-plan-main">
      <div className="paywall-plan-heading">
        <h2>{plan.name}</h2>
        <div className="paywall-price"><strong>{formattedPrice}</strong><span>/month</span></div>
        <div className="paywall-credit"><img src="/images/paywall/credit.svg" alt="" aria-hidden="true" /><span>{plan.credits}</span></div>
      </div>
      <ul className="paywall-features">
        {plan.included.map((feature) => <PlanFeature key={feature}>{feature}</PlanFeature>)}
        {plan.unavailable.map((feature) => <PlanFeature key={feature} unavailable>{feature}</PlanFeature>)}
        {plan.studioFeature && <PlanFeature studio>{plan.studioFeature}</PlanFeature>}
      </ul>
    </div>
    <button type="button" className="paywall-continue" onClick={() => onSelect(plan)}>Continue</button>
  </article>
}

function PaywallPage({ onBack }: { onBack: () => void }) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [purchaseMessage, setPurchaseMessage] = useState('')

  const confirmPurchase = () => {
    if (!selectedPlan) return
    addPurchasedGenerations(selectedPlan.generations)
    setPurchaseMessage(`${selectedPlan.generations.toLocaleString()} generations added to your account.`)
    setSelectedPlan(null)
  }

  return <main className="paywall-page">
    <ImageRevealBackground />
    <CoreInteractiveGrid />
    <header className="paywall-header">
      <button type="button" className="paywall-home" onClick={onBack} aria-label="Back to home"><img src="/images/full-logo.svg" alt="LGPSM" /></button>
      <button type="button" className="paywall-back" onClick={onBack}><ArrowLeft size={18} strokeWidth={1.5} />Back to home</button>
    </header>
    <section className="paywall-intro">
      <h1>Transparent<br />Pricing for all</h1>
      <p>At Slora, pricing is simple and transparent. No hidden fees, no surprises—just clear plans and honest pricing,Choose simplicity. Choose clarity. Choose Slora.</p>
      <div className="paywall-billing-switch" role="group" aria-label="Billing period">
        <button type="button" className={billingPeriod === 'monthly' ? 'is-active' : ''} onClick={() => setBillingPeriod('monthly')}>Monthly</button>
        <button type="button" className={billingPeriod === 'annual' ? 'is-active' : ''} onClick={() => setBillingPeriod('annual')}>Annual <span>Save 30%</span></button>
      </div>
    </section>
    <section className="paywall-plans" aria-label="Pricing plans">
      {plans.map((plan) => <PlanCard key={plan.name} plan={plan} billingPeriod={billingPeriod} onSelect={setSelectedPlan} />)}
    </section>
    {purchaseMessage && <p className="paywall-purchase-message" role="status">{purchaseMessage}</p>}
    {selectedPlan && <div className="paywall-confirm-overlay" role="presentation">
      <section className="paywall-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="paywall-confirm-title">
        <button type="button" className="paywall-confirm-close" onClick={() => setSelectedPlan(null)} aria-label="Close confirmation"><X size={20} strokeWidth={1.5} /></button>
        <p className="paywall-confirm-eyebrow">Test purchase</p>
        <h2 id="paywall-confirm-title">Add {selectedPlan.generations.toLocaleString()} generations?</h2>
        <p>Payment is temporarily skipped for testing. Confirming will add the generations from the <strong>{selectedPlan.name}</strong> plan to this account.</p>
        <div className="paywall-confirm-actions"><button type="button" className="button-secondary" onClick={() => setSelectedPlan(null)}>Cancel</button><button type="button" className="button-primary" onClick={confirmPurchase}>Confirm purchase</button></div>
      </section>
    </div>}
  </main>
}

export { PaywallPage }
