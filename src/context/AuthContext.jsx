import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

export const AuthContext = createContext()

function readStoredLabId() {
  try {
    const value = sessionStorage.getItem("x-lab-id")
    if (!value || value === "null" || value === "undefined") return null
    return value
  } catch {
    return null
  }
}

function writeStoredLabId(value) {
  try {
    if (!value || value === "null" || value === "undefined" || String(value).trim() === "") {
      sessionStorage.removeItem("x-lab-id")
      return
    }
    sessionStorage.setItem("x-lab-id", String(value).trim())
  } catch {}
}

function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Auth profile request timed out")), ms)
    ),
  ])
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [appUser, setAppUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLabId, setSelectedLabIdState] = useState(() => readStoredLabId())

  const mountedRef = useRef(true)
  const bootstrapDoneRef = useRef(false)
  const requestSeqRef = useRef(0)

  const applySelectedLabForRole = (role) => {
    if (role === "SUPER_ADMIN") {
      setSelectedLabIdState(readStoredLabId())
    } else {
      setSelectedLabIdState(null)
      writeStoredLabId(null)
    }
  }

  const fetchAppUser = async (userId) => {
    const requestId = ++requestSeqRef.current

    const query = supabase
      .from("app_users")
      .select("id, full_name, role, laboratory_id, is_active")
      .eq("id", userId)
      .maybeSingle()

    const { data, error } = await withTimeout(query, 10000)

    if (!mountedRef.current || requestId !== requestSeqRef.current) return null

    if (error) {
      console.error("app_users fetch error:", error.message, error.code)
      setAppUser(null)
      return null
    }

    if (!data) {
      console.warn("No app_users row found for:", userId)
      setAppUser(null)
      return null
    }

    setAppUser(data)
    applySelectedLabForRole(data.role)
    return data
  }

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
        console.error("Auth bootstrap failed:", err)
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
          writeStoredLabId(null)
          if (bootstrapDoneRef.current) {
            setLoading(false)
          }
          return
        }

        /**
         * Important:
         * Do NOT push the whole app back into loading=true for routine auth events
         * like token refresh or tab refocus. That is what makes the UI feel like a reload.
         *
         * Only the initial bootstrap owns the global loading screen.
         */
        await fetchAppUser(nextSession.user.id)
      } catch (err) {
        console.error("onAuthStateChange failed:", err)
        if (!mountedRef.current) return
        setAppUser(null)
      } finally {
        if (bootstrapDoneRef.current) {
          setLoading(false)
        }
      }
    })

    return () => {
      mountedRef.current = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const role = appUser?.role ?? null
  const fullName = appUser?.full_name ?? null
  const profileLabId = appUser?.laboratory_id ?? null
  const isAdmin = role === "SUPER_ADMIN"

  const effectiveLabId = isAdmin ? selectedLabId : profileLabId
  const requiresLabSelection = isAdmin && !selectedLabId

  const setSelectedLabId = (id) => {
    const normalized =
      id && id !== "null" && id !== "undefined" && String(id).trim() !== ""
        ? String(id).trim()
        : null

    setSelectedLabIdState(normalized)
    writeStoredLabId(normalized)
  }

  const clearSelectedLab = () => {
    setSelectedLabIdState(null)
    writeStoredLabId(null)
  }

  const value = useMemo(
    () => ({
      session,
      appUser,
      loading,
      role,
      fullName,
      isAdmin,
      labId: profileLabId,
      profileLabId,
      selectedLabId,
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