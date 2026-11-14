/**
 * THE CABINET KIT — what the signed-in panels (association, company, admin,
 * analyst, buyer, rais) share. Styles are the legacy .admin-* rules in
 * styles.css; import shell/styles/standard.css on the page. Each file opens
 * with a full note on its API.
 *
 * Session and sign-in
 *   readCabinetSession(key) / writeCabinetSession(key, pair) / clearCabinetSession(key)
 *   downloadDocument(path, body, name)       POST for a guarded file and save it
 *   <DocButton path body fallbackName>       the "download as Word" button
 *   cabinetPost(path, pair, body?)           → { isOk, status, body }; never rejects
 *   cabinetGet(path)                         → the same shape
 *   useCabinetLogin({ storageKey, ownPage, signIn })
 *                                            → { state, submit, signOut }
 *   <CabinetLogin idPrefix title lead buttonLabel errorText onSubmit />
 *
 * Frame (port of cabinet-nav.js)
 *   <CabinetShell brandSub nav activeId onSelect title backLabel actions?
 *                 logoutLabel onLogout>…views…</CabinetShell>
 *   useCabinetDrawer()                       the small-screen drawer on its own
 *   <CabinetIcon markup />                   bundled inner svg markup → icon
 *
 * Charts (port of chart.js)
 *   monthlySeries(records, options?)  monthLabel(month, lang)
 *   <AreaChart points ariaLabel? emptyText? />
 *
 * Panels
 *   <BizIdPanel credentials />               port of bizid-panel.js
 *   <NewsList items platformLabel sourceLabel emptyText className? />
 *   <NewsCard item platformLabel sourceLabel />   parseNews(unknown)
 *
 * Small pieces
 *   useFlash(ms?) + <FlashNote id? flash />  the fading "✓ Saved" line
 *   formatDateTime(value, lang)  formatDate(value, lang)  localDateTime(value)
 *   webHref(text)  mailHref(text)  phoneHref(text)        safe hrefs or null
 *   classToken(text)                         API value → safe class-name part
 *   MONTHS_SHORT  MONTHS_IN_DATE  BIZID_TEXT              script-copied strings
 */
export { BizIdPanel } from "./BizIdPanel";
export { CabinetIcon } from "./CabinetIcon";
export { CabinetLogin } from "./CabinetLogin";
export { CabinetShell } from "./CabinetShell";
export type { CabinetNavItem } from "./CabinetShell";
export { BIZID_TEXT, MONTHS_IN_DATE, MONTHS_SHORT } from "./cabinetText";
export type { BizIdTextKey } from "./cabinetText";
export { AreaChart, monthLabel, monthlySeries } from "./chart";
export type { ChartPoint, MonthBucket, MonthlyOptions, MonthlySeries } from "./chart";
export { FlashNote, useFlash } from "./flash";
export type { Flash } from "./flash";
export { classToken, formatDate, formatDateTime, localDateTime, mailHref, phoneHref, webHref } from "./format";
export { NewsCard, NewsList, parseNews } from "./News";
export type { NewsItem } from "./News";
export {
  cabinetGet,
  cabinetPost,
  clearCabinetSession,
  readCabinetSession,
  writeCabinetSession,
} from "./session";
export type { CabinetAnswer, CabinetCredentials } from "./session";
export { useCabinetDrawer } from "./useCabinetDrawer";
export type { CabinetDrawer } from "./useCabinetDrawer";
export { useCabinetLogin } from "./useCabinetLogin";
export type { CabinetLogin as CabinetLoginControl, CabinetLoginOptions, CabinetLoginState } from "./useCabinetLogin";
export { downloadDocument } from "./download";
export { DocButton } from "./DocButton";
