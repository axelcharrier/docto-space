import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role;
    } & DefaultSession["user"];
  }
}

// The `jwt`/`session` callback params in auth.ts are typed against
// @auth/core's own interfaces, not next-auth's re-exports of them, so this
// needs @auth/core as a direct (not just transitive) dependency to resolve.
declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    // Authentik's ID token, kept server-side only (never mirrored onto
    // Session) so it can be sent back as id_token_hint on RP-initiated
    // logout — see lib/logout.ts.
    idToken?: string;
  }
}
