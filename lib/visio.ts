import "server-only";

export class VisioError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VisioError";
  }
}

/**
 * Retrieves a required environment variable.
 * @param name - The name of the environment variable to retrieve.
 * @returns The environment variable value.
 */
function env(name: string) {
  const value = process.env[name];
  if (!value) throw new VisioError(`Variable d'environnement ${name} manquante`);
  return value;
}

/**
 * Retrieves an access token for the Visio API using delegated credentials.
 * @param delegatedEmail - The email address used as the delegated scope.
 * @returns The access token returned by the Visio API.
 */
async function getAccessToken(delegatedEmail: string) {
  const response = await fetch(`${env("VISIO_API_URL")}/application/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("VISIO_CLIENT_ID"),
      client_secret: env("VISIO_CLIENT_SECRET"),
      grant_type: "client_credentials",
      scope: delegatedEmail,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("[visio] token error", response.status, await response.text());
    throw new VisioError(`Authentification Visio échouée (${response.status})`, response.status);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Creates a trusted room through the Visio API.
 * @param delegatedEmail - The email address used for delegated API access.
 * @returns The identifier and URL of the created Visio room.
 */
export async function createVisioRoom(delegatedEmail: string) {
  const token = await getAccessToken(delegatedEmail);

  const response = await fetch(`${env("VISIO_API_URL")}/rooms/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ access_level: "trusted" }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("[visio] room error", response.status, await response.text());
    throw new VisioError(`Création de la salle Visio échouée (${response.status})`, response.status);
  }

  // Older self-hosted Meet versions omit `url`; rebuild it from the slug.
  const room = (await response.json()) as { id: string; slug: string; url?: string };
  const url = room.url ?? `${new URL(env("VISIO_API_URL")).origin}/${room.slug}`;
  return { id: room.id, url };
}
