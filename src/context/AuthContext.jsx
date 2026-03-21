import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [session,       setSession]       = useState(null);
  const [appUser,       setAppUser]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedLabId, setSelectedLabId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      if (s?.user) {
        fetchAppUser(s.user.id, s.access_token);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSelectedLabId(null);
      sessionStorage.removeItem("x-lab-id");
      if (session?.user) {
        fetchAppUser(session.user.id, session.access_token);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /**
   * Fetch the app_users record using the authenticated user's own token.
   * Uses maybeSingle() — returns null instead of throwing 406 if no row found.
   *
   * If this returns null, RLS is likely blocking the query.
   * Fix: run in Supabase SQL editor:
   *   CREATE POLICY "Users can read own profile"
   *   ON public.app_users FOR SELECT TO authenticated
   *   USING (auth.uid() = id);
   */
  const fetchAppUser = async (userId, accessToken) => {
    try {
      // Use a fresh client with the user's own token to respect RLS
      const { data, error } = await supabase
        .from("app_users")
        .select("id, full_name, role, laboratory_id, is_active")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("app_users fetch error:", error.message, error.code);
        // If 406 / PGRST116 — RLS is blocking. User can't read their own row.
        // Run the policy SQL above in Supabase to fix.
        setAppUser(null);
        return;
      }

      if (!data) {
        console.warn("No app_users row found for", userId,
          "— make sure this user has a record in the app_users table");
        setAppUser(null);
        return;
      }

      setAppUser(data);
    } catch (err) {
      console.error("fetchAppUser exception:", err);
      setAppUser(null);
    } finally {
      setLoading(false);
    }
  };

  const role    = appUser?.role         ?? null;
  const labId   = appUser?.laboratory_id ?? null;
  const isAdmin = role === "SUPER_ADMIN";

  const effectiveLabId = isAdmin ? selectedLabId : labId;

  const handleSetSelectedLab = (id) => {
    setSelectedLabId(id);
    if (id) {
      sessionStorage.setItem("x-lab-id", id);
    } else {
      sessionStorage.removeItem("x-lab-id");
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      appUser,
      loading,
      role,
      isAdmin,
      labId,
      selectedLabId,
      setSelectedLabId: handleSetSelectedLab,
      effectiveLabId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}