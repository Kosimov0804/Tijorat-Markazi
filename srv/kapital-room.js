/* ============================================================
   KAPITAL — the deal room

   A talk is the only place on this platform where a founder's
   private financials meet a stranger's e-mail address, so the
   rules here are narrower than anywhere else in the module and
   three of them are worth stating out loud.

   1  THE DEAL OWNER IS THE ONLY WRITER OF `nda` AND `declined`.
      Moving a talk to `nda` releases the founder's contact
      block, and that is this module's single irreversible
      disclosure. It happens through talkRespond() — the founder
      accepting — and nowhere else. /talk/stage accepts only
      `diligence`, `terms` and `closed`; a free-form stage
      control over all five would have let an investor unlock
      the founder's phone number themselves, which is the exact
      thing the sealed contact block exists to prevent.
      `declined` is a STATUS, not a stage, so H.ONE(stage,
      TALK_STAGES) cannot silently coerce a founder's refusal
      back to `intro` and leave the request open forever.

   2  talkView() IS A PURE PROJECTION. It writes nothing. An
      earlier shape zeroed the OTHER side's unread counter from
      inside a view — inverted, and a hidden write, so
      talksFor(), which maps the view over every talk, cleared
      every badge on a plain list read. talkPost() increments
      the recipient; talkRead() alone zeroes the caller's own.

   3  MEMBERSHIP IS RE-CHECKED ON EVERY CALL. Gating at open and
      trusting the id afterwards makes a talk id, once seen, a
      permanent capability over somebody else's negotiation.

   The contact block is read LIVE from the deal rather than
   copied onto the talk: a founder who corrects their number
   corrects it everywhere, and a founder who is later erased
   under ZRU-547 leaves no copies scattered across talk rows.

   This file declares no collection. srv/kapital.js owns the one
   declaration of kapital.json, and it is required lazily from
   inside these functions — that keeps the load-time edge
   one-directional (kapital.js requires this file at the top)
   while still letting the room reach the store it shares.
   ============================================================ */
const H = require("./store");

let _K = null;
const K = () => (_K || (_K = require("./kapital")));

/* ---------- vocabulary ---------- */
const TALK_STAGES = ["intro", "nda", "diligence", "terms", "closed"];
const T_STATUS    = ["open", "declined", "archived"];
/* The gate-1 words live beside the talk words because both are the vocabulary
   a human uses about a deal, and srv/kapital.js re-exports them so a caller
   has one import. The STATUS is `rejected`; the VERDICT is `decline`. */
const VERDICTS    = ["pass", "revise", "decline"];
/* Only the founder may move a talk FORWARD into these two. `nda` additionally
   cannot be reached through /talk/stage at all — see talkRespond(). */
const FOUNDER_ONLY_FORWARD = ["nda", "diligence"];
const STAGE_SETTABLE = ["diligence", "terms", "closed"];

/* Messages are embedded in the talk row and trimmed, exactly as bozor.js
   embeds notes in a deal: the whole document is loaded on every read anyway,
   so a separate array buys nothing and costs a second write path and a second
   ownership gate to get wrong. */
const MSG_CAP = 300;
const MSG_LEN = 4000;
/* Four caps, four distinct error codes, because "try again tomorrow" and
   "this founder is at capacity" are different sentences and a founder who is
   told the wrong one gives up on the wrong thing. */
const TALKS_PER_INVESTOR_DAY  = 20;    // an investor is not a mail-merge
const TALKS_PER_DEAL          = 60;    // a founder cannot be swarmed past this
const MSG_PER_SIDE_PER_DAY    = 100;   // PER TALK, not platform-wide
const OPEN_TALKS_PER_INVESTOR = 200;
const OPEN_NOTE_MIN = 60;              // an opening note shorter than this says nothing

const now = () => Date.now();
const dayOf = t => Math.floor(H.N(t) / 864e5);
const put = (st, next) => { st.talks = st.talks.map(t => (t.id === next.id ? next : t)); return next; };

/* ---------- the ownership gate ----------
   The same rule bozor.partyToDeal() enforces, for the same reason: an
   unchecked read here is not a leak of one field, it is a leak of the room. */
const partyToTalk = (talk, actor) =>
  !!talk && !!actor && (String(talk.founderId) === String(actor.id)
                     || String(talk.investorId) === String(actor.id));
/** Derived from the resolved id, never from a body field. */
const sideOf = (talk, actor) =>
  (String(talk.founderId) === String(actor && actor.id) ? "founder" : "investor");

/** Contact holds for `nda` and every stage after it. Gating it on `diligence`
    alone meant a talk that went intro → terms negotiated a term sheet with the
    contact block sealed and no forward path left to open it. */
const released = talk => H.N(talk.contactReleased) > 0;

/** One talk, gated, and the reader's own side of it. Writes NOTHING. */
function talkView(talk, side, deal){
  const mine = side === "founder" ? "founderUnread" : "investorUnread";
  const out = {
    id: talk.id, dealId: talk.dealId, dealName: talk.dealName,
    stage: talk.stage, status: talk.status, side,
    counterparty: side === "founder"
      ? { id: talk.investorId, name: talk.investorName }
      : { id: talk.founderId,  name: talk.founderName },
    ndaAt: talk.ndaAt, contactReleased: talk.contactReleased, releasedBy: talk.releasedBy,
    declineReason: talk.declineReason || "",
    messages: (talk.messages || []).map(m => ({ id: m.id, by: m.by, byName: m.byName,
      side: m.side, kind: m.kind, text: m.text, url: m.url, t: m.t })),
    lastBy: talk.lastBy, lastAt: talk.lastAt, unread: H.N(talk[mine]),
    trail: (talk.trail || []).map(x => Object.assign({}, x)),
    created: talk.created, updated: talk.updated,
  };
  /* Read live from the deal, and only once the founder has accepted. The
     investor's own details are added symmetrically by api.js from the account
     row — one release, both directions, because a one-sided release is a
     bargaining chip and this is not the place to hand anyone one. */
  if(deal && released(talk)) out.contact = Object.assign({}, deal.contact);
  return out;
}

const dealOf = (st, id) => st.deals.find(d => d.id === String(id)) || null;

/* ---------- opening ---------- */
/**
 * An investor knocks on a published deal. Refuses on an unpublished one with
 * `not_found`, never `forbidden`: the set of ids that exist but are not
 * published is the list of every company quietly trying to raise money.
 * One talk per (dealId, investorId) forever — a second open returns the first,
 * ok:true, exactly as bozor's deal room does.
 */
function talkOpen(investor, body){
  const st = K().load();
  const deal = dealOf(st, H.S(body.dealId, 40));
  if(!deal || !K().INVESTOR_VISIBLE.includes(deal.status)) return { error: "not_found" };

  const mine = (st.talks || []).filter(t => String(t.investorId) === String(investor.id));
  const already = mine.find(t => t.dealId === deal.id);
  if(already) return { ok: true, talk: talkView(already, "investor", deal) };

  const message = H.S(body.message, MSG_LEN);
  if(!message) return { error: "message_required" };
  if(message.trim().length < OPEN_NOTE_MIN) return { error: "message_short" };
  /* The NDA text itself lives in legal.js DOCS with a version, so an
     acceptance can record WHICH text was accepted. Until it does, the flag and
     the timestamp are the evidence we honestly have. */
  if(!H.BOOL(body.nda)) return { error: "nda_required" };

  const today = dayOf(now());
  if(mine.filter(t => dayOf(t.created) === today).length >= TALKS_PER_INVESTOR_DAY)
    return { error: "talk_daily_cap" };
  if(mine.filter(t => t.status === "open").length >= OPEN_TALKS_PER_INVESTOR)
    return { error: "open_talk_cap" };
  if((st.talks || []).filter(t => t.dealId === deal.id).length >= TALKS_PER_DEAL)
    return { error: "deal_talk_cap" };

  const at = now();
  const talk = {
    id: H.uid("kt"), dealId: deal.id, dealName: H.S(deal.name, 200),
    /* Frozen at open, not re-read from the deal. If the deal is later claimed
       by a company, the existing talks keep pointing at the party who was
       actually in the room — re-deriving would hand a stranger's conversation
       to a new owner. */
    founderId: H.S(deal.ownerId, 80), founderName: H.S(deal.ownerName || deal.name, 200),
    investorId: H.S(investor.id, 40), investorName: H.S(investor.name, 200),
    stage: "intro", status: "open",
    ndaAt: at, contactReleased: 0, releasedBy: "", declineReason: "",
    messages: [{ id: H.uid("km"), by: H.S(investor.id, 40), byName: H.S(investor.name, 200),
                 side: "investor", kind: "text", text: message, url: "", t: at }],
    trail: [], lastBy: "investor", lastAt: at,
    founderUnread: 1, investorUnread: 0, created: at, updated: at,
  };
  st.talks = (st.talks || []).concat([talk]);
  st.deals = st.deals.map(d => (d.id === deal.id
    ? Object.assign({}, d, { talkCount: H.N(d.talkCount) + 1 }) : d));
  H.logEvent(st, "kapital_talk_opened", { talkId: talk.id, dealId: deal.id, sector: deal.sector,
    stage: deal.stage, ask: deal.ask, currency: deal.currency });
  K().save(st);
  return { ok: true, talk: talkView(talk, "investor", deal) };
}

/**
 * Accept or decline a request. THE DEAL OWNER ONLY, and the only writer of
 * `nda` and of `declined`. A decline carries a one-line reason the investor
 * sees, because a silent decline teaches nobody anything.
 */
function talkRespond(founder, body){
  const st = K().load();
  const talk = (st.talks || []).find(t => t.id === H.S(body.id, 40));
  if(!talk) return { error: "not_found" };
  if(String(talk.founderId) !== String(founder && founder.id)) return { error: "forbidden" };
  if(talk.status !== "open" || talk.stage !== "intro") return { error: "bad_stage" };

  const at = now();
  const accept = H.BOOL(body.accept);
  const deal = dealOf(st, talk.dealId);
  let next;
  if(accept){
    next = Object.assign({}, talk, {
      stage: "nda", ndaAt: talk.ndaAt || at,
      contactReleased: at, releasedBy: "founder",
      /* The system's own voice, never accepted from a client body: a
         client-writable system message is a forgery of the platform. The text
         is a KEY, so the i18n layer renders it in the reader's language rather
         than the server picking one. */
      messages: (talk.messages || []).concat([{ id: H.uid("km"), by: "", byName: "",
        side: "system", kind: "system", text: "contact_released", url: "", t: at }]).slice(-MSG_CAP),
      investorUnread: H.N(talk.investorUnread) + 1, lastBy: "founder", lastAt: at, updated: at,
    });
    H.logEvent(st, "kapital_contact_released", { talkId: talk.id, dealId: talk.dealId });
    H.logEvent(st, "kapital_talk_stage", { talkId: talk.id, dealId: talk.dealId,
      from: "intro", to: "nda", by: "founder" });
  } else {
    next = Object.assign({}, talk, {
      status: "declined", declineReason: H.S(body.reason, 300),
      investorUnread: H.N(talk.investorUnread) + 1, lastBy: "founder", lastAt: at, updated: at,
    });
    H.logEvent(st, "kapital_talk_stage", { talkId: talk.id, dealId: talk.dealId,
      from: "intro", to: "declined", by: "founder" });
  }
  put(st, next);
  K().save(st);
  return { ok: true, talk: talkView(next, "founder", deal) };
}

/* ---------- inside the room ---------- */
/** Append a message. Both sides, membership re-checked. */
function talkPost(actor, body){
  const st = K().load();
  const talk = (st.talks || []).find(t => t.id === H.S(body.id, 40));
  if(!talk) return { error: "not_found" };
  if(!partyToTalk(talk, actor)) return { error: "forbidden" };
  if(talk.status !== "open" || talk.stage === "closed") return { error: "talk_closed" };
  const deal = dealOf(st, talk.dealId);
  if(deal && deal.frozen) return { error: "frozen" };

  const side = sideOf(talk, actor);
  const text = H.S(body.text, MSG_LEN);
  if(!text) return { error: "text_required" };
  /* `system` is not in the accepted set — see talkRespond(). */
  const kind = H.ONE(body.kind, ["text", "link"], "text");
  const today = dayOf(now());
  const mineToday = (talk.messages || [])
    .filter(m => m.side === side && dayOf(m.t) === today).length;
  if(mineToday >= MSG_PER_SIDE_PER_DAY) return { error: "message_daily_cap" };

  const at = now();
  const msg = { id: H.uid("km"), by: H.S(actor.id, 40), byName: H.S(actor.name, 200),
    side, kind, text, url: kind === "link" ? (/^https:\/\//i.test(H.S(body.url, 400))
      ? H.S(body.url, 400) : "") : "", t: at };
  const other = side === "founder" ? "investorUnread" : "founderUnread";
  const next = Object.assign({}, talk, {
    messages: (talk.messages || []).concat([msg]).slice(-MSG_CAP),
    lastBy: side, lastAt: at, updated: at,
  });
  next[other] = H.N(talk[other]) + 1;
  put(st, next);
  /* The talk id and the side. NEVER the text — this stream is read by analysts
     who are party to nothing. */
  H.logEvent(st, "kapital_message", { talkId: talk.id, dealId: talk.dealId, side });
  K().save(st);
  return { ok: true, talk: talkView(next, side, deal) };
}

/**
 * Move the rail. `nda` and `declined` are unreachable from here by
 * construction, and `diligence` — which opens the data room — is a founder-only
 * forward move.
 */
function talkStage(actor, body){
  const st = K().load();
  const talk = (st.talks || []).find(t => t.id === H.S(body.id, 40));
  if(!talk) return { error: "not_found" };
  if(!partyToTalk(talk, actor)) return { error: "forbidden" };
  if(talk.status !== "open") return { error: "talk_closed" };

  const to = H.S(body.stage, 20);
  if(!STAGE_SETTABLE.includes(to)) return { error: "stage_forbidden" };
  const side = sideOf(talk, actor);
  const from = talk.stage;
  if(from === to) return { ok: true, talk: talkView(talk, side, dealOf(st, talk.dealId)) };
  if(from === "closed") return { error: "talk_closed" };
  /* diligence and terms both require an accepted talk: there is nothing to
     diligence and no terms to write while the founder has not answered. */
  if(to !== "closed" && TALK_STAGES.indexOf(from) < TALK_STAGES.indexOf("nda"))
    return { error: "bad_stage" };
  /* Unconditional on the stage NAME, never on the direction of travel. The index comparison that
     used to ride here made the rule positional: from `terms` (3) to `diligence` (2) the test was
     false, so an INVESTOR could walk the rail backwards into the one stage that opens the data
     room. Which way the rail is moving was never what made `diligence` the founder's to grant. */
  if(FOUNDER_ONLY_FORWARD.includes(to)
     && String(actor.id) !== String(talk.founderId)) return { error: "stage_forbidden" };

  const at = now();
  const other = side === "founder" ? "investorUnread" : "founderUnread";
  const next = Object.assign({}, talk, {
    stage: to, status: to === "closed" ? "archived" : talk.status,
    messages: (talk.messages || []).concat([{ id: H.uid("km"), by: "", byName: "",
      side: "system", kind: "system", text: "stage_" + to, url: "", t: at }]).slice(-MSG_CAP),
    lastBy: side, lastAt: at, updated: at,
  });
  next[other] = H.N(talk[other]) + 1;
  put(st, next);
  H.logEvent(st, "kapital_talk_stage", { talkId: talk.id, dealId: talk.dealId,
    from, to, by: side });
  K().save(st);
  return { ok: true, talk: talkView(next, side, dealOf(st, talk.dealId)) };
}

/** End a talk from either side. */
const talkClose = (actor, body) =>
  talkStage(actor, { id: body && body.id, stage: "closed" });

/**
 * Every talk this actor is a party to, either side, newest activity first.
 * It takes NO dealId filter, by design: filtering on a body-supplied dealId
 * hands a founder's entire investor pipeline — who is interested, at what
 * stage, how far along — to any investor who knows one deal id. If a per-deal
 * view is ever needed, filter the already-gated result in the client.
 */
function talksFor(actor){
  const st = K().load();
  const deals = new Map(st.deals.map(d => [d.id, d]));
  const items = (st.talks || [])
    .filter(t => partyToTalk(t, actor))
    .sort((a, b) => H.N(b.lastAt) - H.N(a.lastAt))
    .map(t => talkView(t, sideOf(t, actor), deals.get(t.dealId)));
  return { ok: true, items };
}

/** One talk, gated. The ONLY writer that zeroes an unread counter, and it
    zeroes the CALLER's own. */
function talkRead(actor, idOrBody){
  const id = H.S(idOrBody && idOrBody.id != null ? idOrBody.id : idOrBody, 40);
  const st = K().load();
  const talk = (st.talks || []).find(t => t.id === id);
  if(!talk) return { error: "not_found" };
  if(!partyToTalk(talk, actor)) return { error: "forbidden" };
  const side = sideOf(talk, actor);
  const mine = side === "founder" ? "founderUnread" : "investorUnread";
  const next = Object.assign({}, talk, { seenAt: now() });
  next[mine] = 0;
  put(st, next);
  K().save(st);
  return { ok: true, talk: talkView(next, side, dealOf(st, talk.dealId)) };
}

/**
 * Oversight reads a private negotiation. A separate route from the dashboard
 * on purpose: folding it into the listing would make every routine dashboard
 * load a disclosure. It demands a written reason, writes an access event, and
 * puts that entry in the talk's own trail where BOTH parties see it.
 *
 * The route refuses a shared-password `admin` — an entry reading "someone with
 * the shared password read your negotiation" names nobody, and the
 * accountability is the whole justification for the feature.
 */
function oversightTalk(actor, body){
  const reason = H.S(body.reason, 1000);
  if(reason.trim().length < 20) return { error: "reason_required" };
  const st = K().load();
  const talk = (st.talks || []).find(t => t.id === H.S(body.id, 40));
  if(!talk) return { error: "not_found" };

  const at = now();
  const entry = { kind: "oversight_read", by: H.S(actor && actor.name, 120),
                  byTier: H.S(actor && actor.type, 20), reason, t: at };
  const next = Object.assign({}, talk, {
    trail: (talk.trail || []).concat([entry]).slice(-40), updated: at });
  put(st, next);
  H.logEvent(st, "kapital_talk_read", { talkId: talk.id, dealId: talk.dealId,
    by: entry.byTier, name: entry.by, reason });
  K().save(st);
  /* Oversight reads a side, like anyone else, so the projection is the same
     one both parties get — not a wider view invented for staff. */
  return { ok: true, talk: talkView(next, "founder", dealOf(st, talk.dealId)) };
}

module.exports = {
  TALK_STAGES, T_STATUS, VERDICTS, FOUNDER_ONLY_FORWARD,
  MSG_CAP, MSG_LEN, TALKS_PER_INVESTOR_DAY, TALKS_PER_DEAL,
  MSG_PER_SIDE_PER_DAY, OPEN_TALKS_PER_INVESTOR, OPEN_NOTE_MIN,
  partyToTalk, sideOf, talkView,
  talkOpen, talkRespond, talkPost, talkStage, talkClose,
  talksFor, talkRead, oversightTalk,
};
