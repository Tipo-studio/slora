import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { isAuthProviderEnabled, supabase } from '../../lib/supabase'

function LoginOverlay({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (user: User) => void }) {
  const emailId = useId()
  const passwordId = useId()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password'>(() => window.location.hash.includes('type=recovery') ? 'reset-password' : 'sign-in')
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

  const switchMode = (nextMode: 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password') => {
    setMode(nextMode)
    setPassword('')
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
      if (mode === 'forgot-password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        })
        if (resetError) setError(resetError.message)
        else setMessage('If an account exists for this email, we sent a password reset link.')
      } else if (mode === 'reset-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) setError(updateError.message)
        else {
          window.history.replaceState({}, '', window.location.pathname)
          setMessage('Your password has been updated. You can now sign in.')
          setPassword('')
          setMode('sign-in')
        }
      } else if (mode === 'sign-in') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
          setError(signInError.message)
        } else if (data.user) {
          onAuthenticated(data.user)
        } else {
          setError('Sign-in succeeded but no user session was returned. Please try again.')
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (data.session && data.user) {
          onAuthenticated(data.user)
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
          <p id="login-title">{mode === 'forgot-password' ? 'Reset your password' : mode === 'reset-password' ? 'Choose a new password' : 'Sign in now to create for free'}</p>
        </div>
        <form className="login-form" onSubmit={submitEmailPassword}>
          {(mode === 'sign-in' || mode === 'sign-up') && <>
            <button type="button" className="login-google" onClick={signInWithGoogle} disabled={isSubmitting}><img src="/images/login/google.svg" alt="" aria-hidden="true" /><span>Sign in with Google</span></button>
            <p className="login-or">or</p>
            <div className="login-mode-switch" role="tablist" aria-label="Email authentication mode">
              <button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'is-active' : ''} onClick={() => switchMode('sign-in')} disabled={isSubmitting}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'is-active' : ''} onClick={() => switchMode('sign-up')} disabled={isSubmitting}>Sign up</button>
            </div>
          </>}
          {mode !== 'reset-password' && <div className="login-control">
            <label htmlFor={emailId}>Email</label>
            <input ref={emailInputRef} id={emailId} className="login-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" autoComplete="email" required disabled={isSubmitting} />
          </div>}
          {mode !== 'forgot-password' && <div className="login-control">
            <label htmlFor={passwordId}>{mode === 'reset-password' ? 'New password' : 'Password'}</label>
            <input id={passwordId} className="login-field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required disabled={isSubmitting} />
          </div>}
          {mode === 'sign-in' && <button type="button" className="login-forgot-password" onClick={() => switchMode('forgot-password')} disabled={isSubmitting}>Forgot password?</button>}
          <button type="submit" className="login-submit button-primary" disabled={isSubmitting}>{isSubmitting ? 'PLEASE WAIT…' : mode === 'forgot-password' ? 'SEND RESET LINK' : mode === 'reset-password' ? 'UPDATE PASSWORD' : mode === 'sign-in' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
          {(mode === 'forgot-password' || mode === 'reset-password') && <button type="button" className="login-back-to-signin" onClick={() => switchMode('sign-in')} disabled={isSubmitting}>Back to sign in</button>}
          {message && <p className="login-status login-status-success" role="status">{message}</p>}
          {error && <p className="login-status login-status-error" role="alert">{error}</p>}
        </form>
        <p className="login-terms">By proceeding with the login process, you agree to our <a href="https://www.weshop.ai/policy" target="_blank" rel="noreferrer">User Service Agreement</a> and <a href="https://www.weshop.ai/privacy" target="_blank" rel="noreferrer">Privacy Policy.</a></p>
      </div>
    </div>
  </div>
}

export { LoginOverlay }
