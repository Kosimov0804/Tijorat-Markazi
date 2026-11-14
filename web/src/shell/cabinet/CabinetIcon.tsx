/**
 * CABINET ICON — one line icon in the sidebar's stroke style (data.js svg()).
 *
 *   <CabinetIcon markup={NAV_ICONS.dashboard} />
 *
 * `markup` is the INNER markup of the svg (paths, rects, circles) and must be a
 * string bundled with the app, never anything from the API or a user.
 */
import { trustedHtml } from "../trustedHtml";

export function CabinetIcon({ markup }: { markup: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={trustedHtml(markup)}
    />
  );
}
