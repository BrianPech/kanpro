import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "company" | "candidate";

export interface AuthSuccessResponse {
  user: User;
  session?: Session | null;
  role?: UserRole;
}

export interface AuthSessionResponse {
  user: User | null;
  role: UserRole | null;
}
