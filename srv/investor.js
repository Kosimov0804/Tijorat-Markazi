/* ============================================================
   INVESTOR — the admin-approved investor account tier

   Moliya bozori has had investors since day one, but only as
   PASSPORTS: moliya-capital.js investorSave() stores whatever
   actor(ctx, body) resolves to, and actor() falls through to
   person(body), which mints an identity from any e-mail typed
   into a request body. A passport is a claim about an appetite.
   It is not an account, and it was never meant to carry one.

   Kapital needs an account, because everything Kapital does is
   a disclosure. A founder who reaches the standard's 90% is
   publishing a cap table, a salary bill, customer names and a
   data room, and Modda 21 ZRU-547 makes that consent given to a
   KNOWN counterparty. "Whoever typed this e-mail address" is
   not a known counterparty. So the two rules that define the
   buyer tier define this one, for the same reasons — read
   buyer.js first, this file is its twin:

   1  ADMIN-APPROVED. The account is created by approving an
      application, never by signing up. No sector body knows an
      investor any more than it knows a buyer, so there is no
      association to vouch and oversight is the only approver.
      register.js owns that decision; this module only ever
      sees accounts that already exist.

   2  IN `orgs`, NOT in moliya.json. server.js's unified
      sign-in, buyer.js's cross-tier login registry and
      rights.js's subject resolution each read `orgs` and only
      `orgs`. An account kept anywhere else cannot sign in
      through the front door, cannot be checked for a login
      clash, and cannot exercise the rights the law gives it.
      Rows live at `orgs.investors` with the id prefix "in" —
      deliberately not the passport's "iv", so the prefix alone
      tells a reader which of the two records they hold.

   What this tier adds over a buyer is the THESIS: a ticket
   range, stages, sectors, geographies, instruments and at
   least THESIS_MIN characters of prose. It lives on the
   account rather than on the public passport because it is
   what the approver read in order to say yes, and because a
   founder deciding whether to answer a knock needs to see it.

   THE TRADE — the four enum lists below are COPIES of the ones
   in moliya-capital.js and moliya.js, not imports. Importing
   is the DRY answer and it is the wrong one here. This file is
   required by register.js, api.js, rights.js and kapital.js;
   keeping its dependency set down to store + passwords is what
   lets all four require it in any order, and what stops a
   future kapital-aware branch inside moliya-capital.js from
   closing a require cycle around the tier that authorises
   every read. Dragging the whole Moliya store into memory to
   borrow four string arrays is the wrong price for tidiness.
   The cost of copying is drift, and it is paid in one place:
   these lists are asserted identical to their originals by a
   test, and INSTRUMENTS in particular must stay identical or a
   deal's instrument stops matching an investor's appetite.
   ============================================================ */
const H  = require("./store");
const PW = require("./passwords");

const LOGIN     = /^[a-z0-9][a-z0-9._-]{2,39}$/;   // identical to every other tier's rule
const WATCH_CAP = 200;
/** Characters of thesis. Not decoration: feedFit() scores a deal against this
    text with H.coverage(), and a two-word thesis produces confident noise
    rather than a match. Exported because register.js enforces the same floor
    on the application, and a hard-coded 80 in two files is how they diverge. */
const THESIS_MIN = 80;
const CONTROL   = ["minority", "significant", "control", "jv"];

/* ---- the four copied lists. See THE TRADE, above. ---- */
const INVESTOR_TYPES = ["angel", "vc", "pe", "strategic", "family", "institutional", "dfi"];
/* The LEGACY stage vocabulary of the Investor Marketplace, not the deal's own
   KAP_STAGES: an investor declares appetite in the words the matching engine
   already speaks, and the deal's stage is mapped onto these before matching. */
const STAGES      = ["pre-seed", "seed", "growth", "mature", "project"];
const INSTRUMENTS = ["equity", "convertible", "mezzanine", "debt", "jv", "project-equity"];
const CURRENCIES  = ["UZS", "USD", "EUR", "RUB"];

/** Created lazily on first read, exactly like orgs.buyers. buyer.js's
    loginTaken() scans this same array — a login has to be free across every
    tier that can sign in, or the loser is permanently shadowed at the door. */
const all = orgs => (Array.isArray(orgs.investors) ? orgs.investors : []);

/* ---------- projections: three, and each one a whitelist ----------
   Written field by field rather than as "every field except pwHash". A
   blacklist projection leaks the next field somebody adds to the row, which
   is exactly the failure the investor feed projection is forbidden to have;
   stating the rule for one projection and breaking it in another is worse
   than never stating it. */

/** Everything an investor may see about itself — the password is not on it. */
const view = i => ({
  id: i.id,
  name:         i.name || "",             // the investing ENTITY: fund, family office, holding
  phone:        i.phone || "",            // that entity's own number
  login:        i.login || "",
  contactName:  i.contactName || "",
  role:         i.role || "",
  email:        i.email || "",
  contactPhone: i.contactPhone || "",
  region:       i.region || "",
  about:        i.about || "",
  /* the thesis block */
  type:         i.type || "angel",
  thesis:       i.thesis || "",
  ticketMin:    i.ticketMin || 0,
  ticketMax:    i.ticketMax || 0,
  currency:     i.currency || "USD",
  stages:       Array.isArray(i.stages) ? i.stages : [],
  sectors:      Array.isArray(i.sectors) ? i.sectors : [],
  geos:         Array.isArray(i.geos) ? i.geos : [],
  instruments:  Array.isArray(i.instruments) ? i.instruments : [],
  control:      i.control || "minority",
  horizon:      i.horizon || 0,
  website:      i.website || "",
  minScore:     i.minScore || 0,
  /* behaviour */
  visible:      i.visible !== false,
  watchlist:    Array.isArray(i.watchlist) ? i.watchlist : [],
  seenAt:       i.seenAt || 0,            // stamped by the feed route; drives the nav badge
  created:      i.created || 0,
  updated:      i.updated || 0,
});

/** What an approver or the admin list may see. Also password-free. */
const adminView = i => Object.assign(view(i), {
  watchCount:      (i.watchlist || []).length,
  suspended:       !!i.suspended,
  suspendedReason: i.suspendedReason || "",
});

/**
 * What a FOUNDER may see about the investor who knocked on their door.
 * buyer.js has no equivalent, because a buyer is never shown to a stranger.
 * An investor is, the moment they open a talk — so this projection exists, and
 * it carries no e-mail, no phone, no login and no watchlist. The investor's
 * contact details are earned inside the talk on exactly the same terms as the
 * founder's, and who else is watching a deal is a market signal the platform
 * has not earned the right to hand out.
 */
const publicView = i => ({
  id: i.id, name: i.name || "", type: i.type || "angel", region: i.region || "",
  thesis: i.thesis || "", about: i.about || "", website: i.website || "",
  ticketMin: i.ticketMin || 0, ticketMax: i.ticketMax || 0, currency: i.currency || "USD",
  stages: Array.isArray(i.stages) ? i.stages : [],
  sectors: Array.isArray(i.sectors) ? i.sectors : [],
  instruments: Array.isArray(i.instruments) ? i.instruments : [],
  control: i.control || "minority", horizon: i.horizon || 0,
  /* A row in orgs.investors exists only because oversight approved an
     application. That IS the badge — there is no second verification step to
     read a flag from, so stating it outright here is the honest answer. */
  verified: true,
  created: i.created || 0,
});

function authenticate(orgs, login, password){
  const lg = H.S(login, 80).trim().toLowerCase();
  const pw = String(password == null ? "" : password);
  if(!lg || !pw) return null;
  /* `!x.suspended` is not a nicety. rights.js withdraw() enforces a ZRU-547
     consent withdrawal by writing that flag and nothing else; omit the test
     here and a withdrawal changes a boolean while the cabinet stays open. */
  const i = all(orgs).find(x => String(x.login || "").toLowerCase() === lg
                              && !x.suspended && PW.verify(x, pw));
  if(!i) return null;
  /* The shape api.js's actor() expects. `name` is the investing ENTITY,
     because that is what appears in a founder's talk list — not the individual
     who happens to be typing. Same reasoning as buyer.authenticate(). */
  return { id: i.id, name: i.name, login: i.login, email: i.email || "", raw: i };
}

const findById = (orgs, id) => all(orgs).find(x => x.id === H.S(id, 40)) || null;

/** https only. A website shown to a founder inside a talk is a link this
    platform is putting its name to; anything that does not announce itself as
    encrypted is dropped rather than quietly downgraded. */
const web = v => (/^https:\/\//i.test(H.S(v, 300)) ? H.S(v, 300) : "");

/**
 * The thesis block, sanitised from any source — a registration body, a stored
 * application row, or a profile save. One table, so the enum an approver reads
 * and the enum the feed filters on are narrowed by the same code.
 * `investorType` is read first because register.js stores the block under that
 * name, to keep it clear of the application row's own `kind`.
 */
function thesisBlock(src){
  const s = src || {};
  return {
    type:        H.ONE(s.investorType != null ? s.investorType : s.type, INVESTOR_TYPES, "angel"),
    thesis:      H.S(s.thesis, 2000),
    ticketMin:   H.N(s.ticketMin),
    ticketMax:   H.N(s.ticketMax),
    currency:    H.ONE(s.currency, CURRENCIES, "USD"),
    stages:      H.SUBSET(s.stages, STAGES, 5),
    sectors:     H.LIST(s.sectors, 15),
    geos:        H.LIST(s.geos, 10),
    instruments: H.SUBSET(s.instruments, INSTRUMENTS, 6),
    control:     H.ONE(s.control, CONTROL, "minority"),
    horizon:     H.N(s.horizon),
    website:     web(s.website),
  };
}

/**
 * The same block, shaped for register.js: it is spread onto the application row
 * and later handed to moliya-capital.investorSave() as a passport body. Both
 * `investorType` and `type` are emitted deliberately — the row wants the
 * unambiguous name, investorSave() reads `body.type`, and one function
 * answering both is what keeps the field list in exactly one file.
 */
function applicationFields(src){
  const b = thesisBlock(src);
  return Object.assign({}, b, { investorType: b.type });
}

/** The block moliya-capital.investorSave() expects, and nothing beyond it. */
const passportOf = i => ({
  name: i.name, type: i.type, thesis: i.thesis,
  ticketMin: i.ticketMin, ticketMax: i.ticketMax, currency: i.currency,
  stages: i.stages, sectors: i.sectors, geos: i.geos,
  instruments: i.instruments, control: i.control, horizon: i.horizon,
  visible: i.visible, minScore: i.minScore,
});

/**
 * Fields an investor may change about itself. The login can never move: every
 * talk, watchlist entry and event already points at this account. Neither can
 * the e-mail — it is the key rights.js resolves a data subject by and the key
 * register.js quoted a reference against, so moving it here would orphan both.
 * @returns {{ok:true, investor:object, passport:object}|{error:string}}
 */
function profileSave(orgs, investor, body, saveOrgs){
  const name = H.S(body.name, 200);
  if(!name) return { error: "name_required" };
  const phone = H.S(body.phone, 60);
  if(!phone) return { error: "phone_required" };
  const contactName = H.S(body.contactName, 160);
  if(!contactName) return { error: "contact_required" };

  const b = thesisBlock(body);
  if((b.ticketMin || b.ticketMax) && b.ticketMax < b.ticketMin)
    return { error: "ticket_range_invalid" };
  if(b.thesis.length < THESIS_MIN) return { error: "thesis_short" };

  const prev = investor.raw;
  const next = Object.assign({}, prev, b, {
    name, phone, contactName,
    role:         H.S(body.role, 120),
    contactPhone: H.S(body.contactPhone, 60),
    region:       H.S(body.region, 120),
    about:        H.S(body.about, 2000),
    /* The investor's own floor on the standard. Clamped to 0..100 rather than
       to the gate, because the gate lives in kapital-standard.js and this file
       does not import it; the client's slider starts at the gate, and a floor
       below it filters nothing the feed was not already showing anyway. */
    minScore:     Math.max(0, Math.min(100, H.N(body.minScore))),
    /* Absent means unchanged. Being listed in the public Moliya register is a
       consent separate from holding an account, and a form that forgot to send
       the checkbox must not be able to re-list someone who opted out. */
    visible:      body.visible == null ? (prev.visible !== false) : H.BOOL(body.visible),
    updated:      Date.now(),
  });
  orgs.investors = all(orgs).map(x => (x.id === investor.id ? next : x));
  saveOrgs(orgs);
  /* `passport` is the projection api.js mirrors into moliya.json — one way
     only, fire and forget. Nothing in Kapital ever reads the mirror back. */
  return { ok: true, investor: view(next), passport: passportOf(next) };
}

/**
 * Create the account an approved application earns. Kept here rather than in
 * register.js so that everything which defines an investor record — its
 * fields, its defaults, its login rule — lives in one file. Mirrors
 * buyer.fromApplication().
 */
function fromApplication(app){
  return Object.assign({
    id: H.uid("in"),
    name:         app.name || "",
    phone:        app.phone || "",
    login:        String(app.login || "").toLowerCase(),
    /* The application already stores its chosen password as a hash, so it
       moves across as one — the plaintext never existed on disk. */
    pwHash:       app.pwHash || "",
    contactName:  app.contactName || "",
    role:         app.role || "",
    email:        String(app.email || "").toLowerCase(),
    contactPhone: app.contactPhone || "",
    region:       app.region || "",
    about:        app.about || "",
  }, thesisBlock(app), {
    minScore:  0,                 // no floor until the investor sets one
    watchlist: [],
    seenAt:    0,
    /* The account carries the intent to be listed; approval itself is not that
       consent, so api.js passes visible:false explicitly on the FIRST mirror
       into the public register, where investorSave() defaults it the other way. */
    visible:   true,
    suspended: false, suspendedReason: "",
    created: Date.now(), updated: 0,
  });
}

/**
 * Add or remove a deal from the watchlist.
 * @param {boolean} isPublished resolved by the CALLER from kapital.js and
 *   passed in, so this file keeps buyer.js's dependency set and kapital.js
 *   needs nothing from here. Without the check the watchlist is an existence
 *   oracle: toggling an id and getting `ok` back confirms an unpublished deal.
 * @returns {{ok:true, watchlist:string[], on:boolean}|{error:string}}
 */
function watchToggle(orgs, investor, dealId, saveOrgs, isPublished){
  const id = H.S(dealId, 40);
  if(!id) return { error: "id_required" };

  const have = Array.isArray(investor.raw.watchlist) ? investor.raw.watchlist : [];
  const on = have.includes(id);
  /* Only ADDING asks whether the deal is open. Removing an id already on the
     list reveals nothing new and must always work, or a deal unpublished after
     it was watched would be stuck on that list forever. */
  if(!on && !isPublished) return { error: "deal_not_open" };

  const watchlist = on ? have.filter(x => x !== id) : have.concat([id]).slice(-WATCH_CAP);
  const next = Object.assign({}, investor.raw, { watchlist, updated: Date.now() });
  orgs.investors = all(orgs).map(x => (x.id === investor.id ? next : x));
  saveOrgs(orgs);
  return { ok: true, watchlist, on: !on };
}

module.exports = {
  LOGIN, WATCH_CAP, THESIS_MIN, CONTROL,
  /* TYPES is the name spec 03's export list used and spec 05's /api/kapital/meta
     reads; INVESTOR_TYPES is the name moliya-capital.js gave the same array. One
     array, both names, so neither caller has to remember which spec it read. */
  INVESTOR_TYPES, TYPES: INVESTOR_TYPES, STAGES, INSTRUMENTS, CURRENCIES,
  view, adminView, publicView, authenticate, findById,
  profileSave, fromApplication, applicationFields, watchToggle, all,
};
