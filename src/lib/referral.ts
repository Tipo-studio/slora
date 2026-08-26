const REFERRAL_STORAGE_KEY = 'pending_referral_code'

export function captureReferralCodeFromUrl() {
  const code = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
  if (code) window.localStorage.setItem(REFERRAL_STORAGE_KEY, code)
  return code ?? null
}

export function getPendingReferralCode() {
  return window.localStorage.getItem(REFERRAL_STORAGE_KEY)
}

export function clearPendingReferralCode() {
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY)
}
