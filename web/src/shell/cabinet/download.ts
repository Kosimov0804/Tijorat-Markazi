/**
 * CABINET DOWNLOAD — fetches a document the server guards with credentials
 * and hands it to the browser as a file.
 *
 *   downloadDocument(path, body, fallbackName)   POSTs `body` as JSON, saves the
 *                                                answer under the server's file
 *                                                name, and resolves false when the
 *                                                server refuses or cannot be reached.
 *
 * The credentials travel in the request body. They used to ride in the link's
 * address, where browser history and server logs keep them.
 */

/** The file name out of a Content-Disposition header, kept to a bare name. */
function fileNameFrom(header: string | null, fallback: string): string {
  const match = /filename="?([^";]+)"?/i.exec(header ?? "");
  const name = (match?.[1] ?? "").replace(/[^\w.\- ]+/g, "").trim();
  return name || fallback;
}

export async function downloadDocument(path: string, body: Record<string, unknown>, fallbackName: string): Promise<boolean> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return false;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileNameFrom(response.headers.get("Content-Disposition"), fallbackName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
