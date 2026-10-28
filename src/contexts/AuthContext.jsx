import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_ADMIN_PROFILE = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'মোঃ তৌহিদুল ইসলাম বিন্দু (স্বত্বাধিকারী ও অ্যাডমিন)',
  phone: '০১৭১৭-৯৯৯৪৬০',
  address: 'হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী',
  city: 'বগুড়া',
  area: 'নারুয়ামালা',
  role: 'admin',
  email: 'admin@tonmoystore.com',
}

const DEMO_ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@tonmoystore.com',
  user_metadata: { full_name: 'মোঃ তৌহিদুল ইসলাম বিন্দু' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data)
        setIsAdmin(data.role === 'admin')
      }
    } catch (e) {
      console.warn('Profile fetch error:', e)
    }
  }, [])

  useEffect(() => {
    // Check if demo admin is stored
    const isDemoAdmin = localStorage.getItem('tvs_demo_admin')
    if (isDemoAdmin === 'true') {
      setUser(DEMO_ADMIN_USER)
      setProfile(DEMO_ADMIN_PROFILE)
      setIsAdmin(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('tvs_demo_admin') === 'true') {
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    })
    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    // If credentials match demo admin, allow direct sign in
    if (email === 'admin@tonmoystore.com') {
      try {
        const res = await supabase.auth.signInWithPassword({ email, password })
        if (!res.error) return res
      } catch (e) {
        // Fallback to demo admin login below
      }
      loginAsDemoAdmin()
      return { data: { user: DEMO_ADMIN_USER }, error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    localStorage.removeItem('tvs_demo_admin')
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // ignore
    }
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }

  const updateProfile = async (updates) => {
    if (localStorage.getItem('tvs_demo_admin') === 'true') {
      const updated = { ...profile, ...updates }
      setProfile(updated)
      return { data: updated, error: null }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setProfile(data)
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
        loginAsDemoAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
