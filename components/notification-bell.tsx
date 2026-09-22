import Link from "next/link";
import { BellIcon } from "@phosphor-icons/react/dist/ssr";
import { requireSession } from "@/lib/dal";
import { countUnreadNotifications } from "@/lib/data/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function NotificationBell({ href }: { href: string }) {
  const session = await requireSession();
  const count = await countUnreadNotifications(session.user.id);

  return (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={<Link href={href} aria-label="Notifications" />}
    >
      <BellIcon />
      {count > 0 && <Badge variant="destructive">{count}</Badge>}
    </Button>
  );
}
