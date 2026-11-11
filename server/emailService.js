import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

// Automatically load .env file into process.env if running locally
function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach((line) => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=')
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim()
            const val = trimmed.slice(idx + 1).trim()
            if (!process.env[key] && val) {
              process.env[key] = val
            }
          }
        }
      })
    }
  } catch (_) {}
}
loadEnvFile()

/**
 * Creates and configures the Gmail SMTP mail transporter.
 * Uses Direct SSL on Port 465 with fast connection timeouts.
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const isSecure = port === 465
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'khorsedalam0472@gmail.com'
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'arwwtoeubknbknjb'

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, ''),
    },
    connectionTimeout: 7000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: true,
    },
  })
}

/**
 * Sends a high-priority, responsive HTML email with the 6-digit password reset OTP.
 * Supports:
 *  1. Resend API (if RESEND_API_KEY is configured: sub-second ~200ms delivery!)
 *  2. Gmail Direct SSL SMTP (Port 465) with urgent priority headers
 */
export async function sendPasswordResetOtpEmail({ to, otp, appName = 'মেসার্স তন্ময় ভ্যারাইটি স্টোর' }) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>পাসওয়ার্ড রিসেট ওটিপি - ${appName}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; }
    .container { max-width: 540px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #1A2E23 0%, #2E8B57 100%); padding: 26px 20px; text-align: center; color: #ffffff; }
    .logo-text { font-size: 20px; font-weight: 800; margin: 0; }
    .store-sub { font-size: 12px; color: #d1fae5; margin-top: 4px; }
    .content { padding: 26px 22px; }
    .greeting { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 10px; }
    .message { font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 18px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 16px; text-align: center; margin: 18px 0; }
    .otp-label { font-size: 12px; text-transform: uppercase; font-weight: 700; color: #15803d; letter-spacing: 1px; margin-bottom: 6px; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534; font-family: 'Courier New', Courier, monospace; margin: 0; }
    .expiry-badge { display: inline-flex; align-items: center; background: #fef3c7; border: 1px solid #fde68a; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #92400e; margin-top: 10px; }
    .warning-card { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 0 8px 8px 0; margin-top: 18px; font-size: 12px; color: #78350f; line-height: 1.5; }
    .footer { background: #f9fafb; padding: 16px 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">🛒 ${appName}</div>
      <div class="store-sub">হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া</div>
    </div>
    
    <div class="content">
      <div class="greeting">আসসালামু আলাইকুম,</div>
      <p class="message">
        আপনার <strong>${appName}</strong> অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য নিচের ৬-ডিজিটের ওটিপি কোডটি ব্যবহার করুন:
      </p>

      <div class="otp-box">
        <div class="otp-label">আপনার কনফার্মেশন কোড (OTP)</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry-badge">⏱️ মেয়াদ: ঠিক ২ মিনিট (১২০ সেকেন্ড)</div>
      </div>

      <div class="warning-card">
        <strong>⚠️ নিরাপত্তা সতর্কতা:</strong> এই ওটিপি কোডটি কাউকে জানাবেন না। মেসার্স তন্ময় ভ্যারাইটি স্টোর কখনো আপনার কাছে ওটিপি জানতে চাইবে না।
      </div>
    </div>

    <div class="footer">
      <div>মেসার্স তন্ময় ভ্যারাইটি স্টোর — প্রোপ্রাইটার: মোঃ তৌহিদুল ইসলাম বিন্দু | হেল্পলাইন: ০১৭১৭-৯৯৯৪৬০</div>
      <div style="margin-top: 4px; color: #9ca3af;">© ${new Date().getFullYear()} M/S Tonmoy Varity Store. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `[ ${appName} ]
পাসওয়ার্ড রিসেট কনফার্মেশন কোড: ${otp}
মেয়াদ: ২ মিনিট (১২০ সেকেন্ড)
⚠️ কোডটি কাউকে জানাবেন না।`

  // 1. Ultra-Fast Resend API (150ms HTTP Delivery)
  const resendApiKey = process.env.RESEND_API_KEY || ''
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const resend = new Resend(resendApiKey.trim())
      const fromEmail = process.env.RESEND_FROM || 'Tonmoy Varity Store <onboarding@resend.dev>'
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `🔐 ওটিপি কোড: ${otp} - ${appName}`,
        html: htmlContent,
        text: textContent,
      })
      if (!error && data?.id) {
        return { success: true, messageId: data.id, provider: 'resend' }
      }
      if (error) {
        console.warn('Resend send warning, falling back to Gmail SMTP:', error)
      }
    } catch (resendErr) {
      console.error('Resend delivery exception, falling back to Gmail SMTP:', resendErr)
    }
  }

  // 2. High-speed Direct SSL Gmail SMTP
  const transporter = getMailTransporter()
  if (!transporter) {
    return { success: false, error: 'Mail transporter not configured' }
  }

  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'khorsedalam0472@gmail.com'
  const from = process.env.SMTP_FROM || `"মেসার্স তন্ময় ভ্যারাইটি স্টোর" <${user}>`

  const info = await transporter.sendMail({
    from,
    to,
    subject: `🔐 ওটিপি কোড: ${otp} - ${appName}`,
    priority: 'high',
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
      'Priority': 'urgent',
    },
    text: textContent,
    html: htmlContent,
  })

  return { success: true, messageId: info.messageId, provider: 'gmail_smtp' }
}
