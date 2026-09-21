export const ROLES = ["doctor", "astronaut"] as const;

export type Role = (typeof ROLES)[number];

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
