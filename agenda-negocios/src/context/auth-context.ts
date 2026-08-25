import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  sessionError: string;
  retrySession: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
