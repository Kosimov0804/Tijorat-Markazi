/* ============================================================
   KAPITAL — THE OVERSIGHT SURFACE

   The gate-1 queue, the pipeline dashboard and every privileged override a human
   from oversight may exercise over a deal or an investor account. It lives in its
   own file because srv/kapital.js stood at the 800-line ceiling and this is the
   cohesive group that comes off cleanly: nothing here is on a founder's or an
   investor's path, and everything here needs the same one permission.

   THE RULE OF THIS FILE, stated once: EVERY PRIVILEGED WRITE PASSES
   GATES.oversightOnly(actor) BEFORE IT TOUCHES A ROW. There is no branch that
   "just" sets a flag.

   That rule is written down because its absence is what this file was extracted
   to fix. GATES.apply() asserts actorRole on every STATUS move, so for a long
   while the module looked authorized: unpublish, republish and reopen all went
   through it. The four powers that change no status did not. freeze, unfreeze,
   resetSubmissions and clearRestriction each wrote privileged state with a bare
   Object.assign, and investorOverride() suspended an investor account through a
   hook, and NONE of them ever asked who the caller was — the only assertion of
   actorRole in the module sat inside a function they did not call. Route-level
   tier checks in srv/api.js were the whole of the defence, one layer, in another
   file, for the field standing between the eleven RESTRICTED_SECTORS and
   publication. Authorization asserted only where the code happens to pass through
   it is not authorization; it is a coincidence with a good record so far.

   The lazy KP() closes no cycle: srv/kapital.js requires this module directly and
   finishes building its exports before any route can call in here.
   ============================================================ */
const H = require("./store"), KS = require("./kapital-standard");
const GATES = require("./kapital-gates");
const V = require("./kapital-views");
/* Resolved at CALL time, never at load time, so whichever module Node happens to
   load second cannot capture a half-built exports object. */
let _kp = null;
const KP = () => _kp || (_kp = require("./kapital"));

const now = () => Date.now(), dayOf = t => Math.floor(H.N(t) / 864e5);
/** Immutable row replacement, the same one kapital.js uses: map, never splice. */
const put = (st, next) => { st.deals = st.deals.map(d => (d.id === next.id ? next : d)); return next; };

/* ---------- reading ---------- */
/** The gate-1 queue. Association logins are refused at the route, not here: this
    module knows ids, not tiers — but see oversightDecide for what is NOT left to
    the route. */
function oversightQueue(body){
  const K = KP(), st = K.load(), status = H.ONE(body && body.status, K.D_STATUS, "screening");
  const limit = Math.max(1, Math.min(200, H.N(body && body.limit, 50)));
  const counts = { screening: 0, rejected: 0, published: 0, total: st.deals.length };
  for(const d of st.deals) if(counts[d.status] != null) counts[d.status]++;
  return { ok: true, counts, items: st.deals.filter(d => d.status === status)
    .sort((a, b) => H.N(a.submitted) - H.N(b.submitted)).slice(0, limit).map(V.reviewView) };
}

/** Where is the pipeline stuck, and what may I do about it. Aggregates and
    metadata only — no message body ever reaches this screen. */
function oversightDashboard(body){
  const K = KP(), st = K.load(), at = now(), today = dayOf(at), talks = st.talks || [];
  if(K.driftSweep(st)) K.save(st);
  const windowDays = Math.max(7, Math.min(365, H.N(body && body.windowDays, 90)));
  const idle = d => Math.floor((at - H.N(d.updated)) / 864e5);
  const brief = d => ({ id: d.id, title: d.name, owner: d.ownerName, ownerId: d.ownerId,
    status: d.status, updated: d.updated });
  const byInvestor = new Map();
  for(const t of talks) if(dayOf(t.created) === today) byInvestor.set(t.investorId, (byInvestor.get(t.investorId) || 0) + 1);
  return { windowDays,
    stages: K.D_STATUS.map(s => ({ status: s, n: st.deals.filter(d => d.status === s).length, currency: "USD",
      value: st.deals.reduce((t, d) => t + (d.status === s ? H.N(d.ask) : 0), 0) })),
    /* A frozen deal leaves this panel: it is already being dealt with, and
       leaving it here means a permanent row under buttons that do nothing. */
    stuck: st.deals.filter(d => K.STUCK_DAYS[d.status] != null && !d.frozen && idle(d) >= K.STUCK_DAYS[d.status])
      .map(d => Object.assign(brief(d), { idleDays: idle(d), threshold: K.STUCK_DAYS[d.status] }))
      .sort((a, b) => b.idleDays - a.idleDays),
    /* The panel with teeth: an investor is reading a deal whose working copy no
       longer meets the bar the platform promised. */
    drift: st.deals.filter(d => d.status === "published" && H.N(d.driftSince)).map(d => Object.assign(brief(d),
      { score: H.N((d.score || {}).overallExact), gate: K.PUBLISH_MIN, since: d.driftSince,
        graceLeft: Math.max(0, K.DRIFT_GRACE_DAYS - Math.floor((at - H.N(d.driftSince)) / 864e5)) })),
    talks: { open: talks.filter(t => t.status === "open").length,
      silent: talks.filter(t => t.status === "open" && at - H.N(t.lastAt) > 10 * 864e5).length,
      openedToday: talks.filter(t => dayOf(t.created) === today).length,
      /* An investor opening thirty rooms in a day is harvesting, not investing. */
      topInvestorToday: Math.max(0, ...byInvestor.values()) },
    ai: { on: K.aiReady() } };
}

/* ---------- the overrides ---------- */
/* Every action names the statuses it is legal from, so a button that cannot work
   is never rendered and a bad request is refused in one place. The `from` lists
   are a projection of TRANSITIONS for the client's benefit; GATES.can() inside
   apply() is what actually rules, so the two cannot drift into a permission.

   `reject` is NOT here. Oversight's rejection is dealQualify({verdict:"decline"})
   — see FINALISED below and the missing `reject` row in kapital-gates.js.

   suspend / unsuspend / override were declared in TRANSITIONS and reachable from
   no code path at all, which left `suspended` — a status in D_STATUS, in
   FOUNDER_FROZEN, in the dashboard stage list and in the status table — both
   unreachable AND inescapable. A status that can be entered and never left is a
   trap; one that can never be entered is a lie in the vocabulary. They are wired
   here, as a pair, or they would not be wired at all. */
const SUSPENDABLE = ["draft", "screening", "rejected", "qualified", "standardizing",
                     "ready", "published", "paused"];
const OV_ACTIONS = {
  unpublish: { to: "paused", from: ["published"], reason: true },
  republish: { to: "published", from: ["paused"], reason: false },
  reopen: { to: "draft", from: ["rejected"], reason: false },
  suspend: { to: "suspended", from: SUSPENDABLE, reason: true },
  unsuspend: { to: "*", from: ["suspended"], reason: true },
  override: { to: "qualified", from: ["rejected"], reason: true },
};
/* The non-transition powers, listed so the route surface and the client read one
   name each rather than guessing at strings. */
const OV_FLAGS = ["freeze", "unfreeze", "resetSubmissions", "clearRestriction"];
const OV_INVESTOR = ["investorSuspend", "investorReinstate"];
/* Spec 02 spells clearRestriction `clearRestricted`. One alias, resolved once. */
const OV_ALIAS = { clearRestricted: "clearRestriction" };

/** The override. Every one writes the reason where the FOUNDER can read it: a
    founder who cannot see why their deal was pulled simply resubmits it, so a
    private admin memo costs a second review. `hooks.setInvestorSuspended` is
    supplied by api.js — suspending an investor writes to orgs.investors, and this
    module does not touch orgs. */
function investorOverride(actor, body, hooks, action, reason){
  const on = action === "investorSuspend", fn = hooks && hooks.setInvestorSuspended;
  if(on && !reason) return { error: "reason_required" };
  if(typeof fn !== "function") return { error: "forbidden" };
  if(!fn(H.S(body.investorId, 40), on, reason)) return { error: "not_found" };
  const st = KP().load();
  H.logEvent(st, "kapital_override", { action, investorId: H.S(body.investorId, 40),
    by: H.S(actor && actor.type, 20) });
  KP().save(st); return { ok: true, suspended: on };
}

/**
 * The single entry point, and the single authorization checkpoint. Nothing below
 * it runs for a caller GATES.oversightOnly() refuses, which is what makes the
 * four flag writes and the two investor overrides as guarded as the status moves
 * that always went through apply(). The route may refuse an `assoc` login before
 * this; that is a second layer, not this one.
 */
function oversightDecide(actor, body, hooks){
  const denied = GATES.oversightOnly(actor); if(denied) return denied;
  const raw = H.S(body.action, 30), action = OV_ALIAS[raw] || raw;
  const reason = H.S(body.reason, 1000), at = now();
  if(OV_INVESTOR.includes(action)) return investorOverride(actor, body, hooks, action, reason);
  const st = KP().load(), d = st.deals.find(x => x.id === H.S(body.id, 40));
  if(!d) return { error: "not_found" };
  const logged = next => {
    H.logEvent(st, "kapital_override", { dealId: d.id, from: d.status, to: next.status, action,
      by: H.S(actor && actor.type, 20) });
    KP().save(st); return { ok: true, deal: V.reviewView(next) };
  };
  if(OV_FLAGS.includes(action)) return ovFlag(st, d, actor, action, reason, at, logged);
  if(action === "reject"){
    /* ONE rejection path. This used to be an OV_ACTIONS row executed as a pure
       status move: no deal.qualify, no verdict row finalised, no inputHash — so
       the 24-hour cooldown and the unchanged_since_decline content lock both
       opted out of every rejection issued from the oversight panel. Rejecting IS
       issuing a gate-1 verdict, so it goes where gate-1 verdicts are finalised
       and the two controls attach to it like any other decline. */
    if(!reason) return { error: "reason_required" };
    return KP().dealQualify(actor, { id: H.S(body.id, 40), verdict: "decline", note: reason });
  }
  return ovMove(st, d, actor, action, reason, at, logged);
}

/** The four powers that change no status. They still write privileged state, so
    they re-assert the checkpoint here rather than trusting that the only caller
    already did — a second entry point added later must not be able to skip it. */
function ovFlag(st, d, actor, action, reason, at, logged){
  const denied = GATES.oversightOnly(actor); if(denied) return denied;
  const stamp = { adminNote: reason, adminBy: H.S(actor && actor.name, 120), adminAt: at };
  if(action === "freeze" || action === "unfreeze"){
    const on = action === "freeze"; if(on && !reason) return { error: "reason_required" };
    if(on && KP().TERMINAL.includes(d.status)) return { error: "bad_transition" };
    return logged(put(st, Object.assign({}, d, stamp, { frozen: on, updated: at })));
  }
  if(action === "resetSubmissions"){
    if(!reason) return { error: "reason_required" };
    return logged(put(st, Object.assign({}, d, stamp, { submissionCount: 0, updated: at })));
  }
  /* The eleven RESTRICTED_SECTORS are stamped restricted:true at submit and
     dealPublish refuses while the clearance is absent — and for a long while
     NOTHING wrote that field, so every alcohol, pharma, medical-device, banking,
     insurance, microfinance, licensed-education, mining, energy, aviation and
     security-services deal was unpublishable by anyone, forever, under a
     `forbidden` nobody could clear. This is the writer. `restricted` stays true
     because it is the fact; the clearance is the separate record of a licence
     check a human made.
     A CLEARANCE IS GRANTED FOR ONE SECTOR, and the sector it names is stored with
     it. Without that, a founder submitted as "pharma", oversight inspected the
     licence and cleared it, the founder then re-saved the header as "mining" —
     and the clearance survived to cover a sector nobody had ever looked at.
     kapital.js clearanceOf() drops it the moment the sector moves; this is the
     other half of that pair and neither works alone. */
  return logged(put(st, Object.assign({}, d, stamp,
    { restrictedClearedBy: H.S(actor && actor.name, 120) || "oversight",
      restrictedClearedFor: H.S(d.sector, 120), restrictedClearedAt: at, updated: at })));
}

/** The status-changing half of the override. `unfreeze` exists because `freeze`
    without it stranded a deal under buttons none of which released it, and
    `unsuspend` exists for the same reason one size larger. */
function ovMove(st, d, actor, action, reason, at, logged){
  const denied = GATES.oversightOnly(actor); if(denied) return denied;
  const spec = OV_ACTIONS[action];
  if(!spec || !spec.from.includes(d.status)) return { error: "bad_transition" };
  if(spec.reason && !reason) return { error: "reason_required" };
  const stamp = { adminNote: reason, adminBy: H.S(actor && actor.name, 120), adminAt: at };
  const patch = Object.assign({}, stamp, { note: reason });
  if(action === "unpublish") patch.publishedSnapshot = null;
  /* Where the deal came from, so unsuspend has somewhere to put it back. The
     snapshot is deliberately NOT cleared on suspend: the feed filters on
     `status`, so a suspended deal is already invisible to every investor, and
     keeping the frozen copy is what lets unsuspend restore the listing exactly
     as it stood rather than silently demoting a published deal. */
  if(action === "suspend") patch.restoredTo = H.S(d.status, 40);
  if(action === "override"){
    /* An overturned decline is still a qualification, and a status with no
       decision recorded behind it is how a deal comes to sit in `qualified` with
       nobody's name on the ruling. */
    patch.qualify = { verdict: "pass", by: H.S(actor && actor.name, 120),
      byTier: H.S(actor && actor.type, 20), note: reason, at, ai: null };
  }
  if(action === "republish"){
    /* Not a rubber stamp: the deal must have published at least once and must
       still clear the gate on a fresh recomputation. */
    if(!H.N(d.publishedAt) || !KS.standardMet(d).ok) return { error: "below_gate", standard: KS.progress(d) };
    const snap = KP().versioned(d, at);
    patch.publishedSnapshot = snap;
    patch.publishHistory = (d.publishHistory || []).concat([{ v: snap.v, at, overallExact: snap.overallExact }]).slice(-20);
    patch.driftSince = 0;
  }
  const to = spec.to === "*" ? restoreTarget(d) : spec.to;
  if(action === "unsuspend") patch.restoredTo = "";
  const mv = GATES.apply(d, to, action, actor, patch); if(mv.error) return mv;
  if(action === "unpublish" || action === "suspend")
    H.logEvent(st, "kapital_delisted", { dealId: d.id, sector: d.sector, reason: "oversight" });
  if(action === "suspend") H.logEvent(st, "kapital_suspended", { dealId: d.id, sector: d.sector });
  return logged(put(st, mv.deal));
}

/** Where an unsuspend puts the deal back. `restoredTo` is what suspend recorded;
    anything missing, terminal, or itself `suspended` falls to `draft` rather than
    to a status the founder cannot act on — the exit from suspension is not the
    place to close a raise on somebody's behalf, and it must never fail to be an
    exit at all. */
function restoreTarget(deal){
  const K = KP(), to = H.S(deal.restoredTo, 40);
  return (to && to !== "suspended" && !K.TERMINAL.includes(to) && K.D_STATUS.includes(to)) ? to : "draft";
}

module.exports = {
  oversightQueue, oversightDashboard, oversightDecide, investorOverride,
  /* The route surface, exported so srv/api.js and the admin client name one
     string each instead of two spellings of it. */
  OV_ACTIONS, OV_FLAGS, OV_INVESTOR, OV_ALIAS,
};
