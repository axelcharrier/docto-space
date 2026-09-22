// Custom server: Next.js + a WebSocket endpoint on /ws, in one process.
//
// Route handlers can't keep a WebSocket open (Next closes the socket once
// the response is done), so the upgrade is handled here instead. Being in
// the same process as the server actions lets both share the in-memory
// listener registry on globalThis — see lib/events.ts, which is the other
// half of this file.
//
// Plain JS on purpose: this file is run by Node directly, not bundled.

import { createServer } from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { getToken } from "next-auth/jwt";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
// Must match LIVE_LISTENERS_KEY in lib/events.ts.
const LIVE_LISTENERS_KEY = "__liveListeners";
// Detects dead connections (laptop closed, network dropped) that never sent
// a FIN; also keeps nginx's proxy_read_timeout (60s by default) from firing.
const HEARTBEAT_MS = 30_000;

const listeners = (globalThis[LIVE_LISTENERS_KEY] ??= new Map());

function subscribe(userId, listener) {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(userId);
  };
}

// Reads the Auth.js session cookie of the upgrade request and returns the
// user id, or null. Same JWT + secret as auth.ts, so no DB hit.
async function userIdFromRequest(req) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const token = await getToken({
    req: { headers: { cookie: req.headers.cookie ?? "" } },
    secret,
    // Auth.js prefixes the cookie with __Secure- when served over https.
    secureCookie: (process.env.AUTH_URL ?? "").startsWith("https://"),
  });
  return token?.sub ?? null;
}

const app = next({ dev, hostname, port, turbopack: dev });
await app.prepare();

const handle = app.getRequestHandler();
const handleUpgrade = app.getUpgradeHandler();

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (socket, _req, userId) => {
  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
  });

  const unsubscribe = subscribe(userId, () => {
    if (socket.readyState === socket.OPEN) socket.send("refresh");
  });
  socket.on("close", unsubscribe);
});

const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, HEARTBEAT_MS);
wss.on("close", () => clearInterval(heartbeat));

const server = createServer((req, res) => handle(req, res));

server.on("upgrade", async (req, socket, head) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname !== "/ws") {
    // Next's own upgrades (HMR in dev).
    return handleUpgrade(req, socket, head);
  }

  let userId = null;
  try {
    userId = await userIdFromRequest(req);
  } catch (error) {
    console.error("[ws] auth failed", error);
  }
  if (!userId) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, userId);
  });
});

server.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port} (${dev ? "dev" : "production"})`);
});
