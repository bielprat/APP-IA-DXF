/** Small fetch wrapper for the app's JSON API: throws an Error with the server's Catalan message. */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new Error("No hi ha connexió amb el servidor. Torna-ho a provar.");
  }
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "No s'ha pogut completar l'operació.");
  return body as T;
}

export function postJson<T>(input: string, data?: unknown): Promise<T> {
  return apiFetch<T>(input, { method: "POST", headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) });
}
