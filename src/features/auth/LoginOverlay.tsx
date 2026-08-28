import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { isAuthProviderEnabled, supabase } from '../../lib/supabase'

function LoginOverlay({ onClose, onAuthenticated, initialMode = 'sign-in' }: { onClose: () => void; onAuthenticated: (user: User) => void; initialMode?: 'sign-in' | 'sign-up' }) {
  const emailId = useId()
  const passwordId = useId()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password'>(() => {
    if (initialMode === 'sign-up') return 'sign-up'
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const queryType = new URLSearchParams(window.location.search).get('type')
    return hashParams.get('type') === 'recovery' || queryType === 'recovery' ? 'reset-password' : 'sign-in'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isConfirmationPending, setIsConfirmationPending] = useState(false)
  const [resendAvailableAt, setResendAvailableAt] = useState(0)

  const emailRedirectTo = `${window.location.origin}/signup`
  const resendCooldownMs = 60_000
  const canResendConfirmation = Date.now() >= resendAvailableAt

  const clearAuthCallbackUrl = () => {
    window.history.replaceState({}, '', '/signup')
    window.location.hash = ''
  }

  useEffect(() => {
    if (!resendAvailableAt) return
    const timer = window.setInterval(() => {
      if (Date.now() >= resendAvailableAt) {
        setResendAvailableAt(0)
        window.clearInterval(timer)
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAvailableAt])

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (hashParams.get('type') === 'signup' || hashParams.has('access_token')) {
      setMode('sign-in')
      setIsConfirmationPending(false)
      setMessage('Email confirmed successfully. You can now sign in.')
      clearAuthCallbackUrl()
    }
  }, [])

  const resetFeedback = () => {
    setError('')
    setMessage('')
  }

  const switchMode = (nextMode: 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password') => {
    setMode(nextMode)
    setPassword('')
    setIsConfirmationPending(false)
    resetFeedback()
  }

  const resendConfirmationEmail = async () => {
    resetFeedback()
    if (!canResendConfirmation) {
      setError('Please wait before requesting another confirmation email.')
      return
    }
    setIsSubmitting(true)
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })
      if (resendError) setError(resendError.message)
      else {
        setResendAvailableAt(Date.now() + resendCooldownMs)
        setMessage('Confirmation email sent. Please check your inbox and spam folder.')
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to resend confirmation email.')
    } finally {
      setIsSubmitting(false)
    }
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
          redirectTo: emailRedirectTo,
        })
        if (resetError) setError(resetError.message)
        else setMessage('If an account exists for this email, we sent a password reset link.')
      } else if (mode === 'reset-password') {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          setError(sessionError.message)
          return
        }
        if (!data.session) {
          setError('This password reset link is invalid or has expired. Please request a new link.')
          return
        }
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) setError(updateError.message)
        else {
          clearAuthCallbackUrl()
          setMessage('Your password has been updated. You can now sign in.')
          setPassword('')
          setMode('sign-in')
        }
      } else if (mode === 'sign-in') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
          if (signInError.message.toLowerCase().includes('email not confirmed')) {
            setIsConfirmationPending(true)
            setMessage('Please confirm your email before signing in.')
            setError('')
          } else {
            setError(signInError.message)
          }
        } else if (data.user) {
          onAuthenticated(data.user)
        } else {
          setError('Sign-in succeeded but no user session was returned. Please try again.')
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: emailRedirectTo },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (data.user && data.user.email_confirmed_at) {
          // Only authenticated users with a confirmed email may enter the app.
          onAuthenticated(data.user)
        } else {
          // Supabase creates the pending auth record before email confirmation.
          // Do not treat the returned user/session as a completed signup.
          if (data.session) await supabase.auth.signOut()
          setIsConfirmationPending(true)
          setMessage('Please confirm your email before your account is activated.')
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
        {isConfirmationPending ? <div className="login-form">
          <p className="login-status login-status-success" role="status">{message}</p>
          <p className="login-status">Open the link in your email to confirm your account. After confirmation, return here and sign in.</p>
          <button type="button" className="login-submit button-primary" onClick={() => switchMode('sign-in')} disabled={isSubmitting}>BACK TO SIGN IN</button>
          <button type="button" className="login-back-to-signin" onClick={resendConfirmationEmail} disabled={isSubmitting || !canResendConfirmation}>{isSubmitting ? 'SENDING…' : 'RESEND CONFIRMATION EMAIL'}</button>
          {error && <p className="login-status login-status-error" role="alert">{error}</p>}
        </div> : <form className="login-form" onSubmit={submitEmailPassword}>
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
        </form>}
        <p className="login-terms">By proceeding with the login process, you agree to our <a href="https://www.weshop.ai/policy" target="_blank" rel="noreferrer">User Service Agreement</a> and <a href="https://www.weshop.ai/privacy" target="_blank" rel="noreferrer">Privacy Policy.</a></p>
      </div>
    </div>
  </div>
}

export { LoginOverlay }
