import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";
import { roleFromGroups } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Authentik({
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      issuer: process.env.AUTHENTIK_ISSUER,
      // Authentik's discovery document reports its `issuer` WITH a
      // trailing slash, which Auth.js's OIDC client requires to match
      // exactly — so AUTHENTIK_ISSUER keeps the slash. But Auth.js also
      // derives the discovery URL as `${issuer}/.well-known/...`, which
      // would double the slash and 404. Set `wellKnown` explicitly to
      // avoid that.
      wellKnown: `${process.env.AUTHENTIK_ISSUER}.well-known/openid-configuration`,
      // "profile" is the scope Authentik uses by default to expose the
      // `groups` claim (the user's group names) on the ID token/userinfo.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: {
    // Stateless (cookie) session: no database in this project, and Proxy
    // needs to be able to read the session without hitting one.
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, profile }) {
      // `profile` is only present right after sign-in; persist the role
      // we derive from it into the JWT so it survives subsequent requests.
      if (profile) {
        token.role = roleFromGroups(profile.groups);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
});
