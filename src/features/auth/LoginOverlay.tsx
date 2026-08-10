import { useState } from 'react'

function LoginOverlay({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

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
        <div className="login-form">
          <button type="button" className="login-google"><img src="/images/login/google.svg" alt="" aria-hidden="true" /><span>Sign in with Google</span></button>
          <p className="login-or">or</p>
          <p className="login-email-label">Continue with email</p>
          <input className="login-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" aria-label="Email address" />
          <input className="login-field" type="text" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Get verification code" aria-label="Verification code" />
          <button type="button" className="login-submit button-primary">SIGN IN</button>
        </div>
        <p className="login-terms">By proceeding with the login process, you agree to our <a href="https://www.weshop.ai/policy" target="_blank" rel="noreferrer">User Service Agreement</a> and <a href="https://www.weshop.ai/privacy" target="_blank" rel="noreferrer">Privacy Policy.</a></p>
      </div>
    </div>
  </div>
}

export { LoginOverlay }
