/**
 * Automated Test Suite for Email OTP-based Forgot & Reset Password System
 */

import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetUserPassword,
  generateSecureOtp,
  hashSecret,
  createSignedToken,
} from '../server/authService.js'

async function runTestSuite() {
  console.log('\n=============================================================')
  console.log('🧪 Starting Forgot & Reset Password System Automated Tests')
  console.log('=============================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${testName}`)
      failed++
    }
  }

  // 1. Test Unregistered Email is rejected and prompted to create account
  const unregisteredEmail = `unregistered_${Date.now()}@example.com`
  const unregRes = await requestPasswordReset({ email: unregisteredEmail, ip: '127.0.0.1' })
  assert(
    unregRes.success === false && unregRes.notRegistered === true && unregRes.error.includes('অ্যাকাউন্ট তৈরি'),
    'Step 1a: Unregistered email is rejected and prompted to create account'
  )

  // 1b. Request Password Reset for registered user (e.g. admin@tonmoystore.com)
  const testEmail = 'admin@tonmoystore.com'
  const reqRes = await requestPasswordReset({ email: testEmail, ip: '127.0.0.1' })
  assert(
    reqRes.success === true && reqRes.expiresIn === 120 && Boolean(reqRes.otpSession),
    'Step 1b: Registered user receives OTP session and 120s expiry'
  )

  const otpSession = reqRes.otpSession

  // 2. Test Invalid OTP rejection & attempt tracking
  const badOtpRes = await verifyPasswordResetOtp({ email: testEmail, otp: '000000', otpSession })
  assert(
    badOtpRes.success === false && badOtpRes.attemptsRemaining === 4,
    'Step 2: Incorrect OTP is rejected and remaining attempts decremented (4 left)'
  )

  // 3. Exhaust attempts on the signed session
  let curSession = badOtpRes.newOtpSession
  for (let i = 2; i <= 5; i++) {
    const res = await verifyPasswordResetOtp({ email: testEmail, otp: '11111' + i, otpSession: curSession })
    if (res.newOtpSession) curSession = res.newOtpSession
  }

  const lockRes = await verifyPasswordResetOtp({ email: testEmail, otp: '999999', otpSession: curSession })
  assert(
    lockRes.success === false && lockRes.error.includes('সর্বোচ্চ ৫ বার'),
    'Step 3: Maximum 5 attempts limit is strictly enforced'
  )

  // 4. Test Valid OTP verification with HMAC signed session
  const validEmail = `verified_${Date.now()}@example.com`
  const testOtp = generateSecureOtp()
  const testOtpHash = hashSecret(testOtp)
  const validSession = createSignedToken({
    email: validEmail,
    otpHash: testOtpHash,
    userId: 'test-user-id-123',
    expiresAt: Date.now() + 120 * 1000,
    attempts: 0,
    maxAttempts: 5,
    createdAt: Date.now(),
  })

  // Verify with correct OTP
  const verifyRes = await verifyPasswordResetOtp({
    email: validEmail,
    otp: testOtp,
    otpSession: validSession,
  })
  assert(
    verifyRes.success === true && Boolean(verifyRes.resetToken),
    'Step 4: Correct OTP accepted and 10-minute reset authorization token issued'
  )

  const resetToken = verifyRes.resetToken

  // 5. Test Password Reset with Weak / Short password
  const weakRes = await resetUserPassword({
    email: validEmail,
    resetToken,
    newPassword: '123',
  })
  assert(
    weakRes.success === false && weakRes.error.includes('কমপক্ষে ৬'),
    'Step 5: Weak password (< 6 characters) is rejected'
  )

  // 6. Test Password Reset with Valid Password
  const successRes = await resetUserPassword({
    email: validEmail,
    resetToken,
    newPassword: 'NewSecurePassword2026!',
  })
  assert(
    successRes.success === true,
    'Step 6: Password successfully updated with valid authorization token'
  )

  // 7. Test Expired OTP (120 seconds limit)
  const expiredSession = createSignedToken({
    email: validEmail,
    otpHash: testOtpHash,
    userId: 'test-user-id-123',
    expiresAt: Date.now() - 1000, // already expired!
    attempts: 0,
    maxAttempts: 5,
    createdAt: Date.now() - 121000,
  })

  const expiredRes = await verifyPasswordResetOtp({
    email: validEmail,
    otp: testOtp,
    otpSession: expiredSession,
  })
  assert(
    expiredRes.success === false && expiredRes.isExpired === true,
    'Step 7: 120-second expiration is strictly enforced by the backend'
  )

  console.log('\n=============================================================')
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`)
  console.log('=============================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
