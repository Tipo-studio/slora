import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowLeft, X } from 'lucide-react'
import { ImageRevealBackground } from '../../components/home/ImageRevealBackground'
import { addPurchasedGenerations, getCurrentPackage, subscribeToFreeGenerationChanges, type PackageName } from '../../lib/freeGeneration'
import { CoreInteractiveGrid } from '../core/CoreInteractiveGrid'

type PlanSlug = 'one-time' | 'creator' | 'studio'

type Plan = {
  name: PackageName
  slug: PlanSlug
  price: string
  generations: number
  credits: string
  included: string[]
  unavailable: string[]
  studioFeature?: string
  customPrompt?: boolean
}

const plans: Plan[] = [
  {
    name: 'One time',
    slug: 'one-time',
    price: '$4.99',
    generations: 5,
    credits: '5 Generation ~ $0.99 each',
    included: ['Everything Included', 'Results per Generation up to 2', 'HD Unlock'],
    unavailable: ['Unlimited History', 'Batch Generation', 'Bulk try-on', 'Queue priority'],
  },
  {
    name: 'Creator',
    slug: 'creator',
    price: '$9.99',
    generations: 300,
    credits: '300 Generations ~ $0.03 each',
    included: ['Everything Included', 'Results per Generation 2–4', 'HD Unlock', '1 month History'],
    unavailable: ['Batch Generation', 'Bulk try-on', 'Queue priority'],
  },
  {
    name: 'Studio',
    slug: 'studio',
    price: '$19.99',
    generations: 700,
    credits: '700 Generations ~ $0.03 each',
    included: ['Everything Included', 'Results per Generation up to 8', 'HD Unlock', 'Unlimited History', 'Batch Generation', 'Bulk try-on', 'Queue priority'],
    unavailable: [],
    studioFeature: 'Custom prompt',
    customPrompt: true,
  },
]

function PlanFeature({ children, unavailable = false, studio = false }: { children: string; unavailable?: boolean; studio?: boolean }) {
  const icon = studio ? '/images/paywall/check-studio.svg' : unavailable ? '/images/paywall/check-disabled.svg' : '/images/paywall/check-included.svg'
  return <li className={`paywall-feature ${unavailable ? 'is-unavailable' : ''}`}>
    <img src={icon} alt="" aria-hidden="true" />
    <span>{children}</span>
  </li>
}

function PlanCard({ plan, billingPeriod, isSelected, isCurrentPackage, onSelect }: { plan: Plan; billingPeriod: 'monthly' | 'annual'; isSelected: boolean; isCurrentPackage: boolean; onSelect: (plan: Plan) => void }) {
  const isOneTimePlan = plan.name === 'One time'
  const monthlyPrice = Number.parseFloat(plan.price.slice(1))
  const price = isOneTimePlan || billingPeriod === 'monthly' ? monthlyPrice : monthlyPrice * .7
  const formattedPrice = `$${price.toFixed(2)}`
  const billingLabel = isOneTimePlan ? 'one time' : billingPeriod === 'annual' ? 'per month, billed annually' : 'per month'
  const planSlug = plan.slug
  return <article id={`paywall-plan-${planSlug}`} className={`paywall-plan paywall-plan-${planSlug} ${isSelected ? 'is-selected' : ''} ${isCurrentPackage ? 'is-current-package' : ''}`}>
    {isCurrentPackage && <span className="paywall-current-package-badge">Current</span>}
    <div className="paywall-plan-main">
      <div className="paywall-plan-heading">
        <h2>{plan.name}</h2>
        <div className="paywall-price"><strong>{formattedPrice}</strong><span>/{billingLabel}</span></div>
        <div className="paywall-credit"><img src="/images/paywall/credit.svg" alt="" aria-hidden="true" /><span>{plan.credits}</span></div>
      </div>
      <ul className="paywall-features">
        {plan.included.map((feature) => <PlanFeature key={feature}>{feature}</PlanFeature>)}
        {plan.unavailable.map((feature) => <PlanFeature key={feature} unavailable>{feature}</PlanFeature>)}
        {plan.studioFeature && <PlanFeature studio>{plan.studioFeature}</PlanFeature>}
      </ul>
    </div>
    <button type="button" className="paywall-continue" onClick={() => onSelect(plan)} disabled={isCurrentPackage}>{isCurrentPackage ? 'Current package' : 'Continue'}</button>
  </article>
}

function PaywallPage({ onBack, onPurchaseComplete, initialPlan, user, onRequestLogin }: { onBack: () => void; onPurchaseComplete: () => void; initialPlan?: 'one-time' | 'creator' | 'studio'; user: User | null; onRequestLogin: () => void }) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [activePlan, setActivePlan] = useState<PlanSlug>('creator')
  const [currentPackage, setCurrentPackage] = useState(() => getCurrentPackage())
  const [purchaseMessage, setPurchaseMessage] = useState('')

  useEffect(() => {
    if (!initialPlan) return
    const plan = plans.find((item) => item.name.toLowerCase().replace(' ', '-') === initialPlan)
    if (!plan) return
    setActivePlan(initialPlan)
    window.requestAnimationFrame(() => document.getElementById(`paywall-plan-${initialPlan}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }, [initialPlan])

  useEffect(() => subscribeToFreeGenerationChanges(() => setCurrentPackage(getCurrentPackage())), [])

  const confirmPurchase = () => {
    if (!selectedPlan) return
    if (!user || user.is_anonymous) {
      setSelectedPlan(null)
      onRequestLogin()
      return
    }

    addPurchasedGenerations(selectedPlan.generations, selectedPlan.name as PackageName)
    setPurchaseMessage(`${selectedPlan.generations.toLocaleString()} generations added to your account.`)
    setSelectedPlan(null)
    window.setTimeout(onPurchaseComplete, 600)
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
      {plans.map((plan) => <PlanCard key={plan.name} plan={plan} billingPeriod={billingPeriod} isSelected={activePlan === plan.slug} isCurrentPackage={currentPackage === plan.name} onSelect={(selected) => { setActivePlan(plan.slug); setSelectedPlan(selected) }} />)}
    </section>
    {purchaseMessage && <p className="paywall-purchase-message" role="status">{purchaseMessage}</p>}
    {selectedPlan && <div className="paywall-confirm-overlay" role="presentation">
      <section className="paywall-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="paywall-confirm-title">
        <button type="button" className="paywall-confirm-close" onClick={() => setSelectedPlan(null)} aria-label="Close confirmation"><X size={20} strokeWidth={1.5} /></button>
        <p className="paywall-confirm-eyebrow">{user && !user.is_anonymous ? 'Test purchase' : 'Sign in required'}</p>
        <h2 id="paywall-confirm-title">{user && !user.is_anonymous ? `Add ${selectedPlan.generations.toLocaleString()} generations?` : `Sign in to purchase ${selectedPlan.name}`}</h2>
        <p>{user && !user.is_anonymous ? <>Payment is temporarily skipped for testing. Confirming will add the generations from the <strong>{selectedPlan.name}</strong> plan to this account.</> : 'Purchases and package benefits are available only to signed-in accounts.'}</p>
        <div className="paywall-confirm-actions"><button type="button" className="button-secondary" onClick={() => setSelectedPlan(null)}>Cancel</button><button type="button" className="button-primary" onClick={confirmPurchase}>{user && !user.is_anonymous ? 'Confirm purchase' : 'Sign in'}</button></div>
      </section>
    </div>}
  </main>
}

export { PaywallPage }
