/* ============================================================
   CABINET NAVIGATION ON SMALL SCREENS

   The four cabinets (admin, association, company, analyst) share the
   .admin-shell grid: a 250px sidebar beside the content. Below 900px the
   sidebar used to reflow into a wrapped row of buttons stacked above the
   content — on a 390x844 phone that block was 366px tall, so 43% of the
   screen was navigation before a single figure appeared.

   Here it becomes a drawer instead: hidden off-canvas, opened by a button
   in the topbar, closed by the scrim, Escape, or picking a destination.
   Content starts at the top of the screen where it belongs.

   Injected from script so all four cabinets get identical behaviour without
   four copies of the markup drifting apart.
   ============================================================ */
(function(){
  "use strict";

  const shell = document.querySelector(".admin-shell");
  const side  = document.querySelector(".admin-side");
  const bar   = document.querySelector(".admin-topbar");
  if(!shell || !side || !bar) return;

  const isDrawer = () => window.matchMedia("(max-width:900px)").matches;

  /* ---- the toggle, first thing in the topbar ---- */
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cab-burger";
  btn.setAttribute("aria-label", "Menyu");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", side.id || (side.id = "cabSide"));
  btn.innerHTML = "<span></span><span></span><span></span>";
  bar.insertBefore(btn, bar.firstChild);

  /* ---- the scrim ---- */
  const scrim = document.createElement("div");
  scrim.className = "cab-scrim";
  scrim.hidden = true;
  shell.appendChild(scrim);

  let lastFocus = null;

  function open(){
    if(!isDrawer()) return;
    lastFocus = document.activeElement;
    shell.classList.add("side-open");
    scrim.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    /* the drawer covers the page, so the page behind it must not scroll */
    document.body.style.overflow = "hidden";
    const first = side.querySelector("button, a");
    if(first) first.focus();
  }

  function close(returnFocus){
    if(!shell.classList.contains("side-open")) return;
    shell.classList.remove("side-open");
    scrim.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if(returnFocus){ (lastFocus && lastFocus.focus ? lastFocus : btn).focus(); }
  }

  const toggle = () => shell.classList.contains("side-open") ? close(true) : open();

  btn.addEventListener("click", toggle);
  scrim.addEventListener("click", () => close(true));

  /* Picking a destination is the end of navigating — get out of the way. */
  side.addEventListener("click", e => {
    if(e.target.closest("button, a")) close(false);
  });

  document.addEventListener("keydown", e => {
    if(e.key === "Escape") close(true);
  });

  /* Keep focus inside the drawer while it covers the page. */
  side.addEventListener("keydown", e => {
    if(e.key !== "Tab" || !shell.classList.contains("side-open")) return;
    const items = [...side.querySelectorAll("button, a, input, select")]
      .filter(n => !n.disabled && n.offsetParent !== null);
    if(!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  /* A drawer left open behind a resize would sit invisibly over the desktop
     layout and lock body scrolling, so close it when the drawer stops being
     the layout. */
  let wasDrawer = isDrawer();
  addEventListener("resize", () => {
    const now = isDrawer();
    if(wasDrawer && !now) close(false);
    wasDrawer = now;
  });
})();
