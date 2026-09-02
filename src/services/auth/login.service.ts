import { apiPost } from "../http-client";
import { setTokens } from "@/lib/auth-token";
import type { AppUser } from "@/lib/types";

export type LoginPayload = {
  login: string;
  password: string;
  rememberMe: boolean;
};

export type LoginResult = {
  ok: true;
  user: AppUser;
};

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
}

// POST /auth/login
export async function login(payload: LoginPayload): Promise<LoginResult> {
  if (!payload.login.trim() || !payload.password) {
    throw new Error("INVALID_LOGIN_PAYLOAD");
  }

  const result = await apiPost<AuthResponse>("/auth/login", {
    email: payload.login.trim(),
    password: payload.password,
  });

  setTokens(
    { accessToken: result.accessToken, refreshToken: result.refreshToken },
    payload.rememberMe
  );

  return { ok: true, user: result.user };
}
