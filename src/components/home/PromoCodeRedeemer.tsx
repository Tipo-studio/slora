import { useEffect, useId, useState } from 'react'
import { Check, Gift } from 'lucide-react'
import { redeemPromoCode } from '../../lib/sivitai'
import { Popup } from '../ui/Popup'

function PromoCodeRedeemer({ onRedeemed }: { onRedeemed: (update: { granted: number; remaining: number }) => void }) {
  const inputId = useId()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedeemed, setIsRedeemed] = useState(false)

  const close = () => {
    if (isSubmitting) return
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
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
      // Keep the input popup open so the feedback remains visible in context.
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to redeem this code.'
      setMessage(nextMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <>
    <button type="button" className={`home2-promo-trigger ${isRedeemed ? 'is-redeemed' : ''}`} onClick={() => setIsOpen(true)} aria-label="Apply referral code" aria-haspopup="dialog" aria-expanded={isOpen}>
      {isRedeemed ? <Check size={15} strokeWidth={2} /> : <Gift size={15} strokeWidth={1.5} />}
      <span>{isRedeemed ? 'Code applied' : 'Apply code'}</span>
    </button>
    <Popup open={isOpen} title="referral code" titleId="home2-promo-title" onClose={close} closeDisabled={isSubmitting} className="home2-promo-popup">
        <div className="home2-promo-art" aria-hidden="true"><img src="/images/reward-code-banner.png" alt="" /></div>
        <div className="home2-promo-form">
          <label htmlFor={inputId}>referral code</label>
          <input id={inputId} value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setMessage('') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void submit() } }} placeholder="code" maxLength={40} autoComplete="off" disabled={isSubmitting || isRedeemed} />
          <p>Enter your referral code to add free generations to your account.</p>
          <button type="button" onClick={() => void submit()} disabled={isSubmitting || isRedeemed}>{isRedeemed ? 'APPLIED' : isSubmitting ? 'APPLYING…' : 'APPLY'}</button>
          {message && <div className={`home2-promo-feedback ${isRedeemed ? 'is-success' : 'is-error'}`} role="status"><strong>{isRedeemed ? 'Redeem successful' : 'Unable to redeem code'}</strong><span>{message}</span></div>}
        </div>
    </Popup>
  </>
}

export { PromoCodeRedeemer }
export default PromoCodeRedeemer
