import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getStoredLabId, setStoredLabId } from '../lib/labStorage'

export const AuthContext = createContext()

function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth profile request timed out')), ms)
    ),
  ])
}

export function AuthProvider({ children }) {
  const [session,            setSession]           = useState(null)
  const [appUser,            setAppUser]            = useState(null)
  const [loading,            setLoading]            = useState(true)
  const [selectedLabId,      setSelectedLabIdState] = useState(() => getStoredLabId())

  const mountedRef       = useRef(true)
  const bootstrapDoneRef = useRef(false)
  const requestSeqRef    = useRef(0)

  // ── Selected lab management ─────────────────────────────────────────
  const applySelectedLabForRole = (role) => {
    if (role === 'SUPER_ADMIN') {
      setSelectedLabIdState(getStoredLabId())
    } else {
      // Non-admins never have a selected lab; clear any stale value
      setSelectedLabIdState(null)
      setStoredLabId(null)
    }
  }

  // ── User profile loader ─────────────────────────────────────────────
  const fetchAppUser = async (userId) => {
    const requestId = ++requestSeqRef.current

    const query = supabase
      .from('app_users')
      .select('id, full_name, role, laboratory_id, is_active, registration_status')
      .eq('id', userId)
      .maybeSingle()

    const { data, error } = await withTimeout(query, 10000)

    // Discard stale responses if auth state changed while we were fetching
    if (!mountedRef.current || requestId !== requestSeqRef.current) return null

    if (error) {
      console.error('[AuthContext] app_users fetch error:', error.message, error.code)
      setAppUser(null)
      return null
    }

    if (!data) {
      console.warn('[AuthContext] No app_users row found for:', userId)
      setAppUser(null)
      return null
    }

    setAppUser(data)
    applySelectedLabForRole(data.role)
    return data
  }

  // ── Bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mountedRef.current) return

        const currentSession = data.session
        setSession(currentSession)

        if (currentSession?.user) {
          await fetchAppUser(currentSession.user.id)
        } else {
          setAppUser(null)
        }
      } catch (err) {
        console.error('[AuthContext] Bootstrap failed:', err)
        if (!mountedRef.current) return
        setSession(null)
        setAppUser(null)
      } finally {
        if (mountedRef.current) {
          bootstrapDoneRef.current = true
          setLoading(false)
        }
      }
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mountedRef.current) return

      setSession(nextSession)

      try {
        if (!nextSession?.user) {
          requestSeqRef.current += 1
          setAppUser(null)
          setSelectedLabIdState(null)
          setStoredLabId(null)
          if (bootstrapDoneRef.current) setLoading(false)
          return
        }

        // Do NOT push the whole app back into loading=true for routine token refreshes.
        // Only the initial bootstrap owns the global loading screen.
        await fetchAppUser(nextSession.user.id)
      } catch (err) {
        console.error('[AuthContext] onAuthStateChange failed:', err)
        if (!mountedRef.current) return
        setAppUser(null)
      } finally {
        if (bootstrapDoneRef.current) setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      listener.subscription.unsubscribe()
    }
  // fetchAppUser is intentionally excluded — stable across renders via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived values ──────────────────────────────────────────────────
  const role               = appUser?.role               ?? null
  const fullName           = appUser?.full_name          ?? null
  const profileLabId       = appUser?.laboratory_id      ?? null
  const isAdmin            = role === 'SUPER_ADMIN'
  const isActive           = appUser?.is_active          ?? true
  const registrationStatus = appUser?.registration_status ?? null

  const effectiveLabId      = isAdmin ? selectedLabId : profileLabId
  const requiresLabSelection = isAdmin && !selectedLabId

  // ── Setters exposed to consumers ────────────────────────────────────
  const updateFullName = (name) => {
    setAppUser(prev => prev ? { ...prev, full_name: name } : prev)
  }

  const setSelectedLabId = (id) => {
    const normalized =
      id && id !== 'null' && id !== 'undefined' && String(id).trim() !== ''
        ? String(id).trim()
        : null

    setSelectedLabIdState(normalized)
    setStoredLabId(normalized)
  }

  const clearSelectedLab = () => {
    setSelectedLabIdState(null)
    setStoredLabId(null)
  }

  // ── Context value (memoized to prevent unnecessary re-renders) ───────
  const value = useMemo(
    () => ({
      session,
      appUser,
      loading,
      role,
      fullName,
      isAdmin,
      isActive,
      registrationStatus,
      labId:              profileLabId,   // backward-compat alias
      profileLabId,
      selectedLabId,
      updateFullName,
      setSelectedLabId,
      clearSelectedLab,
      effectiveLabId,
      requiresLabSelection,
    }),
    [
      session,
      appUser,
      loading,
      role,
      fullName,
      isAdmin,
      isActive,
      registrationStatus,
      profileLabId,
      selectedLabId,
      effectiveLabId,
      requiresLabSelection,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
