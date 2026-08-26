import { supabase } from './supabase'
import { clearPendingReferralCode, getPendingReferralCode } from './referral'

export async function completePendingReferral(userId: string) {
  const referralCode = getPendingReferralCode()
  if (!referralCode || !userId) return false

  const { data, error } = await supabase.rpc('complete_referral', {
    p_friend_user_id: userId,
    p_referral_code: referralCode,
  })
  if (error) throw new Error(error.message)

  const result = Array.isArray(data) ? data[0] : data
  if (result?.completed) {
    clearPendingReferralCode()
    window.dispatchEvent(new CustomEvent('referral-completed'))
  }
  return Boolean(result?.completed)
}
