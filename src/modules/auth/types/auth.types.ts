import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "company" | "candidate";

export interface AuthSuccessResponse {
  user: User;
  role?: UserRole;
}

export interface AuthSessionResponse {
  user: User | null;
  role: UserRole | null;
}
