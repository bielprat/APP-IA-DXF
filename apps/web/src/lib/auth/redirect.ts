/** Only same-origin relative paths are accepted as post-login destinations. */
export function safeCallbackPath(value: string | string[] | undefined | null): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  if (path.startsWith("/login") || path.startsWith("/api/auth")) return "/";
  return path;
}
