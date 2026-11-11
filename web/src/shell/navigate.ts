/* Page changes go through here so a test can watch them: jsdom cannot
   navigate, and its location object cannot be spied on directly. Tests spy
   on the object's methods; goTo and replaceWith call through it. */
export const navigate = {
  /** Opens a page, keeping the current one in the history. */
  to(url: string): void {
    window.location.href = url;
  },
  /** Opens a page in place of the current one, as a redirect does. */
  replace(url: string): void {
    window.location.replace(url);
  },
};

export function goTo(url: string): void {
  navigate.to(url);
}

export function replaceWith(url: string): void {
  navigate.replace(url);
}
