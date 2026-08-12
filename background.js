/* ============================================================
   TIJORAT MARKAZI — page background, one decision in one place

   A real monument photograph wins if one has been added to
   assets/monuments/; the drawn skyline is the fallback, so a page is
   never left without a ground.

   This boots itself. Any page that loads monument-bg.js, skyline.js
   and this file gets the background — there is no per-page wiring to
   forget, and the mount point is created if the page has not declared
   one. Load it AFTER the other two.
   ============================================================ */
(function () {
  function boot() {
    var mount = document.getElementById("skyline");
    if (!mount) {
      // The page never declared one, so put it where .bg-grid sits:
      // a body-level element, fixed, beneath every bit of content.
      mount = document.createElement("div");
      mount.className = "skyline";
      mount.id = "skyline";
      mount.setAttribute("aria-hidden", "true");
      var grid = document.querySelector(".bg-grid");
      if (grid && grid.parentNode) grid.parentNode.insertBefore(mount, grid.nextSibling);
      else document.body.insertBefore(mount, document.body.firstChild);
    }
    if (mount.dataset.kgBooted) return;        // never mount twice
    mount.dataset.kgBooted = "1";

    if (typeof kgMonumentBackground === "function") {
      kgMonumentBackground(mount).then(function (src) {
        if (!src && typeof kgSkyline === "function") kgSkyline(mount);
      });
    } else if (typeof kgSkyline === "function") {
      kgSkyline(mount);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
