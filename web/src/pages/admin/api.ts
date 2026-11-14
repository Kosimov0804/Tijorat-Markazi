/* Every privileged call of the old panel carries this pass in its body
   (admin.js: Object.assign({pass:"admin"}, body)). The server is what checks
   it; the value never reaches the screen or the console from here. */
const ADMIN_PASS = "admin";
const JSON_HEADERS = { "Content-Type": "application/json" };

export type Body = Readonly<Record<string, unknown>>;

/** POSTs a privileged request, the pass first, as admin.js sent it. Rejects when the network or the JSON fails. */
export async function adminPost(path: string, body: Body = {}): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ pass: ADMIN_PASS, ...body }),
  });
  return (await response.json()) as unknown;
}

/** The same request, answering { error: "network" } instead of rejecting. */
export async function adminPostSafe(path: string, body: Body = {}): Promise<unknown> {
  try {
    return await adminPost(path, body);
  } catch {
    return { error: "network" };
  }
}

export async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  return (await response.json()) as unknown;
}

/** The Word export of one appeal: a plain download link, so the pass rides in the query as before. */
export function appealDocHref(id: string): string {
  return `/api/appeal/doc?id=${encodeURIComponent(id)}&pass=${ADMIN_PASS}`;
}
