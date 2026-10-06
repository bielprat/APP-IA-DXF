import "server-only";
import { ZodError } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { UploadRejected } from "./images";

/** Error with an HTTP status and a Catalan message that can be shown to the user. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Cal iniciar sessió.");
  return user;
}

/** Projects are private to their owner (§8). Missing and foreign projects look the same. */
export async function ownedProject(projectId: string, userId: string) {
  const project = await getDb().project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== userId) throw new ApiError(404, "No s'ha trobat el projecte.");
  return project;
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Maps errors to JSON responses without leaking internals. */
export function apiRoute<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
      if (error instanceof UploadRejected) return Response.json({ error: error.message }, { status: 422 });
      if (error instanceof ZodError) return Response.json({ error: "Les dades enviades no són vàlides." }, { status: 400 });
      console.error(JSON.stringify({ event: "api_error", path: new URL(request.url).pathname, message: error instanceof Error ? error.message.slice(0, 300) : "unknown" }));
      return Response.json({ error: "Error intern. Torna-ho a provar." }, { status: 500 });
    }
  };
}
