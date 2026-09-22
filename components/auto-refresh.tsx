"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps the current page in sync without a manual reload:
// - primary: a WebSocket to /ws (served by server.mjs); the server sends
//   "refresh" whenever an action changes something relevant to this user
//   (see notifyUsers() calls in lib/actions/*), and we re-fetch instantly;
// - fallbacks: a slow polling interval, and a refresh when the tab comes
//   back to the foreground, in case the socket was lost.
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let closed = false;

    const connect = () => {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${location.host}/ws`);

      socket.onopen = () => {
        // Something may have changed while we were disconnected.
        if (attempts > 0) router.refresh();
        attempts = 0;
      };
      socket.onmessage = () => router.refresh();
      socket.onclose = () => {
        if (closed) return;
        // Exponential backoff, capped at 30s.
        const delay = Math.min(1_000 * 2 ** attempts, 30_000);
        attempts += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };
    connect();

    const id = setInterval(() => router.refresh(), intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  return null;
}
