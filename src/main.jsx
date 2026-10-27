import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  background: '#1A2E23',
                  color: '#EAF6ED',
                  fontFamily: 'Noto Sans Bengali, Inter, sans-serif',
                },
                success: {
                  iconTheme: { primary: '#2E8B57', secondary: '#EAF6ED' },
                },
                error: {
                  iconTheme: { primary: '#E53E3E', secondary: '#fff' },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
