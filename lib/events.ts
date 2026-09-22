import "server-only";

// In-process pub/sub used to tell open browser tabs "something changed for
// you, re-fetch". The WebSocket side lives in server.mjs (same Node
// process, see the custom server there); server actions call notifyUsers()
// after their writes.
//
// The registry sits on globalThis under LIVE_LISTENERS_KEY because this
// module is bundled by Next while server.mjs is plain Node — globalThis is
// the one thing both module graphs share. It also survives HMR in dev.
//
// Good enough because the app runs as a single process (see
// deploy/compose.yaml); a multi-instance deploy would need Redis or similar
// behind the same function.

export const LIVE_LISTENERS_KEY = "__liveListeners";

type Listener = () => void;

const globalForEvents = globalThis as unknown as {
  [LIVE_LISTENERS_KEY]?: Map<string, Set<Listener>>;
};

const listeners: Map<string, Set<Listener>> = (globalForEvents[LIVE_LISTENERS_KEY] ??=
  new Map());

// Fire-and-forget: nudge every open tab of the given users.
export function notifyUsers(userIds: Iterable<string>) {
  for (const id of new Set(userIds)) {
    listeners.get(id)?.forEach((listener) => listener());
  }
}
