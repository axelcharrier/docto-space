import type { Notification } from "@prisma/client";
import { marquerLue, marquerToutesLues } from "@/lib/actions/notifications";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const unread = notifications.filter((n) => !n.lue).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Notifications {unread > 0 && `(${unread} non lue${unread > 1 ? "s" : ""})`}
        </h2>
        {unread > 0 && (
          <form action={marquerToutesLues}>
            <Button type="submit" variant="outline" size="sm">
              Tout marquer comme lu
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground">Aucune notification.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <form action={marquerLue}>
                <input type="hidden" name="id" value={n.id} />
                <button
                  type="submit"
                  className={cn(
                    "flex w-full flex-col gap-1 border p-4 text-left transition-colors hover:bg-muted",
                    n.lue ? "border-border text-muted-foreground" : "border-primary bg-card",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{n.titre}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </span>
                  <span className="text-sm">{n.message}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
