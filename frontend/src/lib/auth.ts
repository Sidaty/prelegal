import { api } from "./api";

export interface CurrentUser {
  email: string;
}

export function currentUser(): Promise<CurrentUser> {
  return api("/api/auth/me");
}

export function signIn(email: string, password: string): Promise<CurrentUser> {
  return api("/api/auth/login", "POST", { email, password });
}

export function signUp(email: string, password: string): Promise<CurrentUser> {
  return api("/api/auth/register", "POST", { email, password });
}

export function signOut(): Promise<void> {
  return api("/api/auth/logout", "POST");
}
