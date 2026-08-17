import { useEffect, useId, useState } from 'react'
import { Check, Gift, X } from 'lucide-react'
import { redeemPromoCode } from '../../lib/sivitai'

function PromoCodeRedeemer({ onRedeemed }: { onRedeemed: (update: { granted: number; remaining: number }) => void }) {
  const inputId = useId()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedeemed, setIsRedeemed] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const submit = async () => {
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      setMessage('Enter a promo code.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      const result = await redeemPromoCode(normalizedCode)
      setCode(result.code)
      setMessage(`${result.generationsGranted} free generations added.`)
      setIsRedeemed(true)
      onRedeemed({ granted: result.generationsGranted, remaining: result.creditsRemaining })
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to redeem this code.'
      if (/already redeemed/i.test(nextMessage)) {
        setCode('TIPOSTUDIO')
        setIsRedeemed(true)
      }
      setMessage(nextMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <>
    <button type="button" className={`home2-promo-trigger ${isRedeemed ? 'is-redeemed' : ''}`} onClick={() => setIsOpen(true)} aria-haspopup="dialog" aria-expanded={isOpen}>
      {isRedeemed ? <Check size={15} strokeWidth={2} /> : <Gift size={15} strokeWidth={1.5} />}
      <span>{isRedeemed ? 'Code redeemed' : 'Redeem code'}</span>
    </button>
    {isOpen && <div className="home2-promo-dialog" role="dialog" aria-modal="true" aria-labelledby="home2-promo-title">
      <button type="button" className="home2-promo-backdrop" onClick={() => setIsOpen(false)} aria-label="Close promo code dialog" />
      <div className="home2-promo-panel">
        <button type="button" className="home2-promo-close" onClick={() => setIsOpen(false)} aria-label="Close promo code dialog"><X size={18} strokeWidth={1.75} /></button>
        <Gift size={24} strokeWidth={1.5} aria-hidden="true" />
        <h2 id="home2-promo-title">Redeem promo code</h2>
        <p>Enter your code to add free generations to your account.</p>
        <label htmlFor={inputId}>Promo code</label>
        <div className="home2-promo-field">
          <input id={inputId} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter code" maxLength={40} autoComplete="off" disabled={isSubmitting || isRedeemed} />
          <button type="button" onClick={() => void submit()} disabled={isSubmitting || isRedeemed}>{isRedeemed ? 'Applied' : isSubmitting ? 'Applying…' : 'Apply'}</button>
        </div>
        {message && <p className={isRedeemed ? 'is-success' : 'is-error'} role="status">{message}</p>}
      </div>
    </div>}
  </>
}

export { PromoCodeRedeemer }
export default PromoCodeRedeemer
