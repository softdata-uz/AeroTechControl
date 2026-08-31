export type LoginPayload = {
  login: string;
  password: string;
  rememberMe: boolean;
};

export type LoginResult = {
  ok: true;
};

/**
 * Temporary integration boundary.
 *
 * Replace only this function when the real backend auth contract is ready.
 * The login UI does not need to change.
 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  if (!payload.login.trim() || !payload.password) {
    throw new Error("INVALID_LOGIN_PAYLOAD");
  }

  // Demo-only delay to make the submitting state visible.
  await new Promise((resolve) => setTimeout(resolve, 900));

  return { ok: true };
}
