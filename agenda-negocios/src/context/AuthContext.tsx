import { useEffect, useState, type ReactNode } from "react";

import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./auth-context";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    async function loadSession() {
      setSessionError("");
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error("Error obteniendo la sesión:", error.message);
        setSessionError("No pudimos verificar tu sesión. Probá nuevamente.");
      }

      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setSessionError("");
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function retrySession() {
    setLoading(true);
    setSessionError("");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setSessionError("No pudimos verificar tu sesión. Probá nuevamente.");
    }
    setUser(data.session?.user ?? null);
    setLoading(false);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        retrySession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

