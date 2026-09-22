"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { signOut } from "@/auth";

// signOut() only clears Auth.js's own session cookie. Authentik keeps its
// own SSO session alive, so a plain signOut() lets the user land back on
// /doctor or /astronaut without re-entering credentials on their next
// sign-in. This also ends the session at Authentik (RP-initiated logout,
// https://openid.net/specs/openid-connect-rpinitiated-1_0.html) so the next
// sign-in actually prompts for credentials.
export async function logout() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  // Behind the VPS's nginx the scheme only survives in x-forwarded-proto.
  // Without that header, fall back to AUTH_URL (set in production) and
  // finally to http — guessing https in local dev broke both the cookie
  // name below and post_logout_redirect_uri.
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.AUTH_URL ? new URL(process.env.AUTH_URL).protocol.replace(":", "") : "http");

  const token = await getToken({
    req: { headers: requestHeaders },
    secret: process.env.AUTH_SECRET,
    // Over HTTPS Auth.js stores the session as `__Secure-authjs.session-token`;
    // getToken() defaults to the plain `authjs.session-token` name and would
    // silently return null in production, dropping id_token_hint below.
    secureCookie: protocol === "https",
  });

  await signOut({ redirect: false });

  const params = new URLSearchParams({
    post_logout_redirect_uri: `${protocol}://${host}/login`,
  });
  if (token?.idToken) {
    params.set("id_token_hint", token.idToken);
  }

  // AUTHENTIK_ISSUER keeps its trailing slash (see auth.ts) — Authentik's
  // OIDC provider exposes its end-session endpoint at `<issuer>end-session/`.
  redirect(`${process.env.AUTHENTIK_ISSUER}end-session/?${params}`);
}
