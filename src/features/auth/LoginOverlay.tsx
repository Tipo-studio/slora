import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { isAuthProviderEnabled, supabase } from '../../lib/supabase'

function LoginOverlay({ onClose }: { onClose: () => void }) {
  const emailId = useId()
  const passwordId = useId()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const resetFeedback = () => {
    setError('')
    setMessage('')
  }

  const switchMode = (nextMode: 'sign-in' | 'sign-up') => {
    setMode(nextMode)
    resetFeedback()
  }

  const signInWithGoogle = async () => {
    resetFeedback()
    setIsSubmitting(true)

    try {
      const isGoogleEnabled = await isAuthProviderEnabled('google')
      if (isGoogleEnabled === false) {
        setError('Google sign-in is not enabled for this Supabase project yet.')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
      })

      if (signInError) setError(signInError.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to start Google sign-in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitEmailPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()
    setIsSubmitting(true)

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
          setError(signInError.message)
        } else {
          onClose()
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (data.session) {
          onClose()
        } else {
          setMessage('Account created. Check your email to confirm your account, then sign in.')
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to complete authentication.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
    <div className="login-backdrop" onClick={onClose} />
    <div className="login-panel">
      <img className="login-decoration" src="/images/login/background.svg" alt="" aria-hidden="true" />
      <button type="button" className="login-close" onClick={onClose} aria-label="Close login dialog"><img src="/images/login/close.svg" alt="" aria-hidden="true" /></button>
      <div className="login-content">
        <div className="login-intro">
          <img className="login-logo" src="/images/full-logo.svg" alt="Slora" />
          <p id="login-title">Sign in now to create for free</p>
        </div>
        <form className="login-form" onSubmit={submitEmailPassword}>
          <button type="button" className="login-google" onClick={signInWithGoogle} disabled={isSubmitting}><img src="/images/login/google.svg" alt="" aria-hidden="true" /><span>Sign in with Google</span></button>
          <p className="login-or">or</p>
          <div className="login-mode-switch" role="tablist" aria-label="Email authentication mode">
            <button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'is-active' : ''} onClick={() => switchMode('sign-in')} disabled={isSubmitting}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'is-active' : ''} onClick={() => switchMode('sign-up')} disabled={isSubmitting}>Sign up</button>
          </div>
          <div className="login-control">
            <label htmlFor={emailId}>Email</label>
            <input ref={emailInputRef} id={emailId} className="login-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" autoComplete="email" required disabled={isSubmitting} />
          </div>
          <div className="login-control">
            <label htmlFor={passwordId}>Password</label>
            <input id={passwordId} className="login-field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required disabled={isSubmitting} />
          </div>
          <button type="submit" className="login-submit button-primary" disabled={isSubmitting}>{isSubmitting ? 'PLEASE WAIT…' : mode === 'sign-in' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
          {message && <p className="login-status login-status-success" role="status">{message}</p>}
          {error && <p className="login-status login-status-error" role="alert">{error}</p>}
        </form>
        <p className="login-terms">By proceeding with the login process, you agree to our <a href="https://www.weshop.ai/policy" target="_blank" rel="noreferrer">User Service Agreement</a> and <a href="https://www.weshop.ai/privacy" target="_blank" rel="noreferrer">Privacy Policy.</a></p>
      </div>
    </div>
  </div>
}

export { LoginOverlay }
