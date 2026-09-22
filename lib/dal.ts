import "server-only";

import { redirect } from "next/navigation";
import { forbidden } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/lib/roles";

// Sends unauthenticated users to /login. Call at the top of a protected
// page/layout, before any streaming/Suspense boundary, so it resolves
// before render.
export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

// Same as requireSession(), but also enforces that the signed-in user
// belongs to `role`. A signed-in user with the wrong role gets a real
// 403 via forbidden() instead of being silently redirected.
export async function requireRole(role: Role) {
  const session = await requireSession();

  if (session.user.role !== role) {
    forbidden();
  }

  return session;
}
