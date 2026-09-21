import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { roleFromGroups, ROLE_TO_DB_ROLE } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Only used to persist/link User & Account rows (needed as the FK target
  // for the business models in prisma/schema.prisma) — session storage
  // stays JWT-based below, so this adds no database read to the request path.
  adapter: PrismaAdapter(prisma),
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
        const role = roleFromGroups(profile.groups);
        token.role = role;

        // Authentik groups are the source of truth; mirror the result onto
        // the User row on every sign-in so it stays correct if group
        // membership changes, since the business models (DemandeConsultation,
        // etc.) query User.role directly instead of going through the JWT.
        if (role && token.sub) {
          await prisma.user.update({
            where: { id: token.sub },
            data: { role: ROLE_TO_DB_ROLE[role] },
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
});
