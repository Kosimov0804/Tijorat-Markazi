/**
 * For strings that ship inside the bundle: the T dictionary and the ICONS set
 * carry markup such as <span class="grad">. Never pass anything that came from
 * the API, the URL or a user; render those as ordinary JSX text.
 */
export function trustedHtml(bundledMarkup: string): { __html: string } {
  return { __html: bundledMarkup };
}
