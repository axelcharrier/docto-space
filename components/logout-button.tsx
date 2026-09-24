import { logout } from "@/lib/logout";
import { Button } from "@/components/ui/button";

/**
 * Renders a button for logging out of the application.
 * @returns The logout button component.
 */
export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm">
        Se déconnecter
      </Button>
    </form>
  );
}
