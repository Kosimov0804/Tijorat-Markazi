/* ============================================================
   Header navigation groups.

   The bar carried nine flat links and stopped fitting inside the
   1200px container: the brand wrapped to three lines and the
   sign-out button was pushed off the right edge. The three market
   modules now sit under "Bozorlar" and the two service directories
   under "Xizmatlar", which brings the bar back to six top-level
   items.

   Desktop opens a group on hover (CSS) — this file adds what CSS
   cannot: click and keyboard control, closing on Escape or an
   outside click, and inline expansion inside the burger menu,
   where a floating panel would have nowhere to float.
   ============================================================ */
(() => {
  const nav = document.getElementById("nav");
  const header = document.querySelector(".site-header");
  const inner = document.querySelector(".header-inner");

  /* ---------- does the bar still fit? ----------
     A media query guesses; this measures. The links are un-collapsed for
     one frame, the header is asked whether its content overflows, and the
     answer decides. That survives a language switch (Russian labels are
     longer), browser zoom, and any action button a session adds. */
  let compact = false;
  /* The burger panel must not survive a resize back to the wide bar: the
     .nav.open rules only exist in the collapsed state, so a leftover class is
     invisible at desktop width and then drops the panel open by itself the
     next time the header collapses. */
  const collapsed = () =>
    window.matchMedia("(max-width:950px)").matches || header.classList.contains("is-compact");

  /* The action button is the only way to sign in or out. It does not fit
     beside the burger on a phone, so while the bar is collapsed it lives at
     the bottom of the menu instead, and moves back when the bar returns. */
  const actions = document.querySelector(".header-actions");
  const OBSERVE = { childList:true, subtree:true, characterData:true };
  let mo = null;
  /* Moving the button is itself a childList mutation on .header-actions —
     the node the observer below watches. Pausing the observer around our own
     edits is what stops fit() from re-entering itself forever; disconnect()
     also discards records already queued. */
  function quietly(fn){
    if(mo) mo.disconnect();
    try { fn(); } finally { if(mo && actions) mo.observe(actions, OBSERVE); }
  }
  /* Resolved on every call, never cached: logout.js adds and replaces buttons
     once it knows the session, and a cached reference would resurrect a
     detached node as a duplicate.
     Every .btn moves, not just the first. A signed-in session carries two —
     the page's own call to action and the sign-out button — and moving only
     the first left sign-out behind in the bar, where the collapse tier hides
     it with display:none. That made signing out impossible on a phone.
     Document order is preserved across a round trip because each direction
     walks its source in order and appends in the same order. */
  const inBar = () => actions ? [...actions.querySelectorAll(":scope > .btn")] : [];
  const inMenu = () => nav ? [...nav.querySelectorAll(":scope > .nav-action")] : [];
  function toBar(){
    if(!actions) return;
    inMenu().forEach(btn => { btn.classList.remove("nav-action"); actions.appendChild(btn); });
  }
  function toMenu(){
    if(!nav) return;
    inBar().forEach(btn => { btn.classList.add("nav-action"); nav.appendChild(btn); });
  }
  function placeAction(){
    if(!nav || !actions) return;
    quietly(() => { if(collapsed()) toMenu(); else toBar(); });
  }

  let raf = 0;
  function fit(){
    if(!header || !inner || !nav) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const wasCollapsed = collapsed();
      if(!window.matchMedia("(max-width:950px)").matches){
        /* Always measure the same configuration: bar expanded, button in the
           bar. Measuring wherever the button happened to sit made the answer
           depend on the previous answer — "overflows" moved the button out,
           which made it "fit", which moved it back — and the header strobed
           at 60fps. Fixing the configuration makes `over` a pure function of
           the viewport and the labels. */
        quietly(() => { toBar(); header.classList.remove("is-compact"); });

        /* One read, and it is a true one: the signed-in header really did
           overflow. Carrying a second button (Chiqish) put the row —
           wordmark, six links, both buttons — a couple of pixels past the
           1200px content container, so this correctly reported "does not
           fit" and correctly collapsed to a burger, at every screen size,
           because a wider monitor does not widen a capped container.
           The fix is in the stylesheet: the header now runs on a 1320px
           track of its own. Shrinking the type instead would have left the
           bar a different size on different pages. */
        const over = inner.scrollWidth > inner.clientWidth + 1;
        header.classList.toggle("is-compact", over);
      }
      if(wasCollapsed && !collapsed()) nav.classList.remove("open");
      compact = collapsed();
      placeAction();
    });
  }
  if(header && inner && nav){
    fit();
    addEventListener("resize", fit);
    addEventListener("orientationchange", fit);
    /* the language button rewrites every label, which changes the width */
    const langBtn = document.getElementById("langBtn");
    if(langBtn) langBtn.addEventListener("click", () => setTimeout(fit, 0));
    /* webfonts land after first paint and shift the measurement */
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(() => {});
    /* logout.js swaps the action buttons once it knows the session, which
       changes the width the bar has to fit into. Watching .header-actions
       directly would loop, because fit() restyles that very element — so
       watch for the swap once and re-measure after it settles. */
    if(actions && window.MutationObserver){
      mo = new MutationObserver(() => { fit(); });
      mo.observe(actions, OBSERVE);
    }
  }

  const groups = [...document.querySelectorAll(".nav-group")];
  if(!groups.length) return;

  const pointerIsFine = () => window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  const isMobileMenu = () =>
    window.matchMedia("(max-width:950px)").matches ||
    (header && header.classList.contains("is-compact"));

  const close = g => {
    g.classList.remove("is-open");
    const b = g.querySelector(".nav-gbtn");
    if(b) b.setAttribute("aria-expanded", "false");
  };
  const closeAll = except => groups.forEach(g => { if(g !== except) close(g); });

  const open = g => {
    closeAll(g);
    g.classList.add("is-open");
    const b = g.querySelector(".nav-gbtn");
    if(b) b.setAttribute("aria-expanded", "true");
  };

  groups.forEach(g => {
    const btn = g.querySelector(".nav-gbtn");
    if(!btn) return;

    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      /* On a touch tap the browser sends mouseenter first, so by the time the
         click lands the menu is already open and a naive toggle would shut it
         again. Only treat a click as "close" when a pointer is really hovering. */
      const hovering = g.matches(":hover");
      if(g.classList.contains("is-open") && (!hovering || pointerIsFine())) close(g);
      else open(g);
    });

    /* Enter and Space belong to the click handler — intercepting them here
       made the button open-only. Arrow-down is the one that walks into the
       menu, as a menu button should. */
    btn.addEventListener("keydown", e => {
      if(e.key === "ArrowDown"){
        e.preventDefault();
        open(g);
        const first = g.querySelector(".nav-menu a");
        if(first) first.focus();
      }
    });

    /* Hover is the desktop affordance, but only on a device that really
       hovers, and only where the menu floats — inside the burger the group
       expands inline instead. */
    g.addEventListener("mouseenter", () => { if(pointerIsFine() && !isMobileMenu()) open(g); });
    g.addEventListener("mouseleave", () => { if(pointerIsFine() && !isMobileMenu()) close(g); });

    /* Tabbing out of the last item should not leave a menu hanging open. */
    g.addEventListener("focusout", e => {
      if(!isMobileMenu() && !g.contains(e.relatedTarget)) close(g);
    });
  });

  document.addEventListener("click", e => {
    if(!e.target.closest(".nav-group")) closeAll(null);
  });
  document.addEventListener("keydown", e => {
    if(e.key !== "Escape") return;
    const open = groups.find(g => g.classList.contains("is-open"));
    if(!open) return;
    const btn = open.querySelector(".nav-gbtn");
    close(open);
    if(btn) btn.focus();
  });

  /* Leaving the burger menu collapses every group, so reopening the menu
     does not reveal whatever was expanded last time. */
  if(nav){
    const burger = document.getElementById("burger");
    if(burger) burger.addEventListener("click", () => {
      if(!nav.classList.contains("open")) closeAll(null);
    });
  }
  /* one resize listener, not two: fit() is already rAF-batched */
  window.addEventListener("resize", () => closeAll(null), { passive: true });
})();
