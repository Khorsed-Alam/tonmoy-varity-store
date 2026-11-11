import { requestPasswordReset } from '../../server/authService.js'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const { email } = req.body || {}
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
    const result = await requestPasswordReset({ email, ip })
    return res.status(result.status || 200).json(result)
  } catch (err) {
    console.error('API /api/auth/forgot-password error:', err)
    return res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
