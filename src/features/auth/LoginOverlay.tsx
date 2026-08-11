import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

function LoginOverlay({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const signInWithGoogle = async () => {
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
    }
  }

  const sendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    if (signInError) {
      setError(signInError.message)
    } else {
      setMessage('Check your email for a secure sign-in link.')
    }

    setIsSubmitting(false)
  }

  return <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
    <div className="login-backdrop" onClick={onClose} />
    <div className="login-panel">
      <img className="login-decoration" src="/images/login/background.svg" alt="" aria-hidden="true" />
      <button type="button" className="login-close" onClick={onClose} aria-label="Close login dialog"><img src="/images/login/close.svg" alt="" aria-hidden="true" /></button>
      <div className="login-content">
        <div className="login-intro">
          <img className="login-logo" src="/images/full-logo.svg" alt="Slora" />
          <p id="login-title">Sign in now for free generate</p>
        </div>
        <form className="login-form" onSubmit={sendMagicLink}>
          <button type="button" className="login-google" onClick={signInWithGoogle} disabled={isSubmitting}><img src="/images/login/google.svg" alt="" aria-hidden="true" /><span>Sign in with Google</span></button>
          <p className="login-or">or</p>
          <p className="login-email-label">Continue with email</p>
          <input className="login-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" aria-label="Email address" autoComplete="email" required disabled={isSubmitting} />
          <button type="submit" className="login-submit button-primary" disabled={isSubmitting}>{isSubmitting ? 'SENDING…' : 'EMAIL ME A SIGN-IN LINK'}</button>
          {message && <p className="login-status login-status-success" role="status">{message}</p>}
          {error && <p className="login-status login-status-error" role="alert">{error}</p>}
        </form>
        <p className="login-terms">By proceeding with the login process, you agree to our <a href="https://www.weshop.ai/policy" target="_blank" rel="noreferrer">User Service Agreement</a> and <a href="https://www.weshop.ai/privacy" target="_blank" rel="noreferrer">Privacy Policy.</a></p>
      </div>
    </div>
  </div>
}

export { LoginOverlay }
