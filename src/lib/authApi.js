/**
 * Client-side API helper for Password Reset flow.
 * Talks to backend endpoints:
 *  - POST /api/auth/forgot-password
 *  - POST /api/auth/verify-otp
 *  - POST /api/auth/reset-password
 */

export async function apiForgotPassword(email) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    const err = new Error(data.error || 'ওটিপি কোড পাঠাতে সমস্যা হয়েছে।')
    err.notRegistered = Boolean(data.notRegistered)
    throw err
  }
  return data
}

export async function apiVerifyOtp(email, otp, otpSession) {
  const sessionToken = otpSession || sessionStorage.getItem('tvs_otp_session') || ''
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      otp: otp.trim(),
      otpSession: sessionToken || undefined,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    const err = new Error(data.error || 'ওটিপি কোডটি সঠিক নয়।')
    err.isExpired = Boolean(data.isExpired)
    err.attemptsRemaining = data.attemptsRemaining
    throw err
  }
  return data
}

export async function apiResetPassword(email, resetToken, newPassword) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      resetToken: resetToken.trim(),
      newPassword,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।')
  }
  return data
}
