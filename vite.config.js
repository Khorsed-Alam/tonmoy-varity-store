import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev middleware plugin to serve /api/auth/ routes during local npm run dev
function authApiDevPlugin() {
  return {
    name: 'auth-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        const pathname = url.split('?')[0]

        if (!pathname.startsWith('/api/auth/')) {
          return next()
        }

        let body = {}
        if (req.method === 'POST') {
          try {
            const chunks = []
            for await (const chunk of req) {
              chunks.push(chunk)
            }
            const rawBody = Buffer.concat(chunks).toString()
            if (rawBody.trim()) {
              body = JSON.parse(rawBody)
            }
          } catch (e) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }))
          }
        }

        res.setHeader('Content-Type', 'application/json')

        try {
          const { requestPasswordReset, verifyPasswordResetOtp, resetUserPassword } = await import(
            './server/authService.js'
          )

          if (pathname === '/api/auth/forgot-password') {
            const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
            const result = await requestPasswordReset({ email: body.email, ip })
            res.statusCode = result.status || 200
            return res.end(JSON.stringify(result))
          }

          if (pathname === '/api/auth/verify-otp') {
            const result = await verifyPasswordResetOtp({
              email: body.email,
              otp: body.otp,
              otpSession: body.otpSession,
            })
            res.statusCode = result.status || 200
            return res.end(JSON.stringify(result))
          }

          if (pathname === '/api/auth/reset-password') {
            const result = await resetUserPassword({
              email: body.email,
              resetToken: body.resetToken,
              newPassword: body.newPassword,
            })
            res.statusCode = result.status || 200
            return res.end(JSON.stringify(result))
          }

          res.statusCode = 404
          return res.end(JSON.stringify({ success: false, error: 'Endpoint Not Found' }))
        } catch (err) {
          console.error('Auth API Dev Middleware Error:', err)
          res.statusCode = 500
          return res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), authApiDevPlugin()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
