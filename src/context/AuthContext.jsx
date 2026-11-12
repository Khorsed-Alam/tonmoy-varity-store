import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabaseClient } from '../lib/supabaseClient'

export const AuthContext = createContext(null)

export const SUPER_ADMIN_EMAIL = 'tonmoyverity@gmail.com'
const ADMIN_SALT = 'tonmoy_varity_store_admin_secure_salt_2026'
const ADMIN_PASS_HASH = '3b7c65e060f1f993a9b5f8240963ba3bbc89b68d22e1f1ec2453f8131348d54b'

export const isSuperAdminEmail = (email) => {
  return typeof email === 'string' && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

export const SUPER_ADMIN_PROFILE = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'মোঃ তৌহিদুল ইসলাম বিন্দু (একমাত্র স্বত্বাধিকারী ও অ্যাডমিন)',
  phone: '+880 1717-999460',
  address: 'হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী',
  city: 'বগুড়া',
  area: 'নারুয়ামালা',
  role: 'admin',
  email: SUPER_ADMIN_EMAIL,
}

export const SUPER_ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: SUPER_ADMIN_EMAIL,
  user_metadata: { full_name: 'মোঃ তৌহিদুল ইসলাম বিন্দু' },
}

export async function verifyAdminPassword(password) {
  if (!password || typeof password !== 'string') return false
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(ADMIN_SALT),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(password))
    const hashHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hashHex === ADMIN_PASS_HASH
  } catch (e) {
    return false
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, currentUser) => {
    try {
      const userEmail = currentUser?.email || ''
      if (isSuperAdminEmail(userEmail)) {
        setProfile(SUPER_ADMIN_PROFILE)
        setIsAdmin(true)
        return
      }

      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data)
        // Strict Single-Admin Enforcement: Only tonmoyverity@gmail.com can ever hold admin privileges
        setIsAdmin(data.role === 'admin' && isSuperAdminEmail(userEmail || data.email))
      } else {
        // Self-heal: ensure user record exists in profiles table
        const userMeta = currentUser?.user_metadata || {}
        const newProfile = {
          id: userId,
          full_name: userMeta.full_name || '',
          phone: userMeta.phone || '',
          role: 'customer',
          preferred_language: 'bn',
        }
        const { data: inserted } = await supabaseClient
          .from('profiles')
          .upsert([newProfile])
          .select()
          .single()
        if (inserted) {
          setProfile(inserted)
          setIsAdmin(inserted.role === 'admin' && isSuperAdminEmail(userEmail || inserted.email))
        }
      }
    } catch (e) {
      console.warn('Profile fetch error:', e)
    }
  }, [])

  useEffect(() => {
    // Check if verified super admin session exists
    const hasAdminSession = sessionStorage.getItem('tvs_super_admin_session')
    if (hasAdminSession === 'true') {
      setUser(SUPER_ADMIN_USER)
      setProfile(SUPER_ADMIN_PROFILE)
      setIsAdmin(true)
      setLoading(false)
      return
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user).finally(() => setLoading(false))
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.hash.includes('type=signup'))) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (sessionStorage.getItem('tvs_super_admin_session') === 'true') {
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user)
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.hash.includes('type=signup'))) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        setProfile(null)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const loginAsDemoAdmin = () => {
    localStorage.setItem('tvs_demo_admin', 'true')
    setUser(DEMO_ADMIN_USER)
    setProfile(DEMO_ADMIN_PROFILE)
    setIsAdmin(true)
    return { success: true }
  }

  const signUp = async ({ email, password, fullName, phone }) => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: redirectUrl,
      },
    })

    // Supabase returns identities: [] when user already exists with email enumeration protection
    if (!error && data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        data: null,
        error: {
          code: 'user_already_exists',
          message: 'User already registered with this email',
        },
      }
    }

    // If a session exists immediately (e.g. email confirmation disabled), create profile directly
    if (!error && data?.user && data?.session) {
      try {
        await supabaseClient.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName || '',
          phone: phone || '',
          role: 'customer',
          preferred_language: 'bn',
        })
      } catch (e) {
        console.warn('Profile direct creation notice:', e)
      }
    }

    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase()

    // Strict Single-Admin Gate: tonmoyverity@gmail.com
    if (isSuperAdminEmail(cleanEmail)) {
      const isMasterValid = await verifyAdminPassword(password)

      if (!isMasterValid) {
        // Also verify if valid in Supabase
        try {
          const res = await supabaseClient.auth.signInWithPassword({ email: cleanEmail, password })
          if (!res.error && res.data?.user) {
            sessionStorage.setItem('tvs_super_admin_session', 'true')
            setUser(res.data.user)
            setProfile(SUPER_ADMIN_PROFILE)
            setIsAdmin(true)
            return res
          }
        } catch (_) {}

        return {
          data: null,
          error: new Error('ভুল পাসওয়ার্ড! সঠিক অ্যাডমিন পাসওয়ার্ড প্রদান করুন।'),
        }
      }

      // Master password verified! Grant Super Admin Session
      sessionStorage.setItem('tvs_super_admin_session', 'true')
      setUser(SUPER_ADMIN_USER)
      setProfile(SUPER_ADMIN_PROFILE)
      setIsAdmin(true)
      return { data: { user: SUPER_ADMIN_USER }, error: null }
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    sessionStorage.removeItem('tvs_super_admin_session')
    localStorage.removeItem('tvs_demo_admin')
    try {
      await supabaseClient.auth.signOut()
    } catch (e) {
      // ignore
    }
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }

  const updateProfile = async (updates) => {
    if (sessionStorage.getItem('tvs_super_admin_session') === 'true') {
      const updated = { ...profile, ...updates }
      setProfile(updated)
      return { data: updated, error: null }
    }

    if (!user) return { data: null, error: new Error('No user logged in') }

    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }
    return { data, error }
  }

  const resetPasswordForEmail = async (email) => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/forgot-password` : undefined
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    return { data, error }
  }

  const verifyResetOtp = async ({ email, token }) => {
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'recovery',
    })
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        resetPasswordForEmail,
        verifyResetOtp,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
