import { Role as DbRole } from "@prisma/client";

export const ROLES = ["doctor", "astronaut"] as const;

export type Role = (typeof ROLES)[number];

// Authentik/JWT roles are English; the Prisma schema's User.role enum is
// French (ASTRONAUTE/MEDECIN, chosen to match the rest of the business
// schema) — this is the single place the two vocabularies meet.
export const ROLE_TO_DB_ROLE: Record<Role, DbRole> = {
  doctor: DbRole.MEDECIN,
  astronaut: DbRole.ASTRONAUTE,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// Where each role lands right after a successful sign-in, and the section
// of the app that role is allowed into.
export const ROLE_HOME_PATH: Record<Role, string> = {
  doctor: "/doctor",
  astronaut: "/astronaut",
};

// Extracts the app role from the Authentik `groups` claim. A user must
// belong to a group named exactly "doctor" or "astronaut" in Authentik.
export function roleFromGroups(groups: unknown): Role | undefined {
  if (!Array.isArray(groups)) return undefined;
  return ROLES.find((role) => groups.includes(role));
}
