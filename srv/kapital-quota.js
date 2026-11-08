/* ============================================================
   MOLIYA BOZORI — Kapital · THE DAY-BUCKETED AI THROTTLE

   The platform already has a meter: core.aiUsageCount / aiUsageInc
   over data/ai-usage.json, with AI_FREE_LIMIT = 3. That one stays
   exactly as it is and is still consulted — nothing here routes
   around it. It simply does not fit this cabinet, for two reasons
   worth writing down rather than rediscovering:

   1  It is a LIFETIME counter keyed on an e-mail address. Nothing
      resets it. That is correct for "three free questions on the
      landing page" and wrong for a founder who legitimately
      iterates over ten rubric sections for a fortnight.
   2  In api.js's copilot route a company login is privileged, and
      founders here ARE company accounts — so for the people who
      generate almost all of this module's spend, the platform
      floor does not bite at all.

   So: keep the floor, add a per-day, per-deal and per-actor
   throttle that the lifetime counter cannot express.

   THE TRADE: spend() MUTATES the loaded working copy and returns
   it, exactly as H.logEvent() does, rather than writing on its own
   like aiUsageInc(). That is the codebase's existing distinction —
   stored ROWS are replaced immutably, the loaded document is a
   working copy mutated once and saved once — and it is what lets a
   caller charge the quota, log the event and store the result in a
   single save() instead of three racing writes.

   Two smaller decisions:

   * The bucket is UTC+5, not UTC. Uzbekistan has no DST, so a
     fixed offset needs no library and is exactly right; bucketing
     on UTC would roll a founder's "today" over at 05:00 local,
     mid-morning.
   * An unknown key gets a limit of ZERO, not infinity. A key with
     no declared family is a bug, and the expensive way to fail a
     bug like that is to grant unlimited model spend on a typo. It
     fails loudly and cheaply instead.

   This file declares NO collection. There is exactly one
   H.collection("kapital.json", …) in the module, in srv/kapital.js,
   naming six keys — a second declaration with a different key list
   would erase every verdict, review and throttle row on the next
   save, silently and with no recovery.
   ============================================================ */
const H = require("./store");

/* ---------- the key grammar ----------
   A key is exactly two parts, family FIRST: "<family>:<id>". limitFor() reads the
   family from the FRONT against the table below; it never derives it by removing the
   last segment, and that subtraction is the trap this grammar exists to close.
   srv/api.js mints a person-tier identity as "u:" + email (srv/api.js:59), so
   "screen:actor:u:aziz@example.com" read from the right yields the family
   "screen:actor:u" — undeclared, therefore limited to ZERO, therefore every walk-in
   founder was permanently throttled off /screen and /review with {error:"throttle",
   limit:0} while the company tier worked perfectly and hid it.

   The id is percent-encoded on the way in as well, so a colon inside an owner id is no
   longer even capable of being read as structure: the key has exactly one separator
   that means anything, the first one after the family.

   The per-deal LIFETIME screening cap is deliberately absent: it lives on
   deal.submissionCount, where it survives the day rollover that would otherwise hand a
   founder three fresh submissions every midnight. */
const LIMITS = {
  "screen:actor": 5,        // step-1 advisory drafts, per founder, per day
  review: 6,                // step-2 section reviews, per deal, per day
  "review:actor": 12,       // step-2 section reviews, per founder, per day
  "ai:actor": 12,           // the umbrella over both, per founder, per day
};

/* Longest first, so "review:actor:<owner>" resolves to the per-founder family and never
   to the per-deal "review" it happens to begin with. Derived from LIMITS, so adding a
   family above needs no second edit here. */
const FAMILIES = Object.keys(LIMITS).sort((a, b) => b.length - a.length);

const ACTOR = ":actor";
const FAMILY_MAX = 20, ID_MAX = 60;
/* Percent-encoding can treble a character, so the key ceiling has to allow for it. A
   truncated key would merge two founders into one bucket — a throttle failure that
   reads like ordinary use and would never be reported. */
const KEY_MAX = FAMILY_MAX + 1 + ID_MAX * 3;

const TZ_OFFSET_MIN = 300;
const DAY_MS = 86400000;

/** The local calendar day, "YYYY-MM-DD". */
const today = () => new Date(Date.now() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10);

/** The epoch ms at which the current local day ends — what the client counts
 *  down to, so "try again tomorrow" names a real moment. */
const resetsAt = () => Date.parse(today() + "T00:00:00Z") - TZ_OFFSET_MIN * 60000 + DAY_MS;

/** The stored form of any id. encodeURIComponent escapes ":", "@" and "+" and leaves
 *  "." and "-" alone, so an e-mail-shaped person id survives as one opaque segment and
 *  a company id such as "c7" is unchanged — the two grammars cannot collide. */
const enc = id => encodeURIComponent(H.S(id, ID_MAX));

/** Every key is built here, so no two call sites can spell the same bucket
 *  differently. `family` is a literal from LIMITS, never anything from a request. */
const keyFor = (family, id) => H.S(family, FAMILY_MAX) + ":" + enc(id);

/** The counter for one deal: dealKey("review", d.id) === "review:<dealId>". */
const dealKey = (family, dealId) => keyFor(family, dealId);

/** The umbrella key for an actor, so a caller never has to build it by hand and
 *  no two call sites can spell it differently. */
const actorKey = (family, ownerId) =>
  keyFor(H.S(family, FAMILY_MAX - ACTOR.length) + ACTOR, ownerId);

/* Fails closed on an unfamiliar family — see the header. The family must match at the
   front AND be followed by a non-empty id, so a bare "review" draws nothing either. */
const limitFor = key => {
  const k = H.S(key, KEY_MAX);
  const family = FAMILIES.find(f => k.startsWith(f + ":") && k.length > f.length + 1);
  return family ? H.N(LIMITS[family], 0) : 0;
};

/**
 * Asserted at load, the way kapital.js asserts STUCK_DAYS against D_STATUS. Every
 * declared family must still be readable back out of a key built by the builders, for
 * the id shapes api.js actually mints — the e-mail-shaped person id above all — and an
 * undeclared family must still read as zero. A LIMITS edit that breaks either one now
 * fails the boot instead of silently throttling a whole tier to nothing.
 */
function assertKeys(){
  const probe = "u:a+b.c@example.com";   // the shape that broke it: a colon, a plus, a dot, an at
  for(const f of FAMILIES){
    const built = f.endsWith(ACTOR) ? actorKey(f.slice(0, -ACTOR.length), probe) : dealKey(f, "kd0001");
    if(limitFor(built) !== LIMITS[f])
      throw new Error("kapital-quota: family unreadable in key " + built);
  }
  if(limitFor(actorKey("nosuch", probe)) !== 0 || limitFor(dealKey("nosuch", "kd0001")) !== 0)
    throw new Error("kapital-quota: an unknown family no longer fails closed");
}
assertKeys();

/**
 * Drop every row that is not from today. The array therefore self-cleans on each
 * write and cannot grow — the same discipline as EVENT_CAP in store.js. `throttle`
 * is a named ARRAY of {key, day, n} rows, never a map: H.collection() rebuilds
 * any non-array key as [] on load, so a map would vanish on the first save.
 */
function prune(st){
  const day = today();
  const rows = Array.isArray(st.throttle) ? st.throttle : [];
  st.throttle = rows.filter(r => r && r.day === day);
  return st;
}

const usedIn = (st, key) => {
  const day = today(), k = H.S(key, KEY_MAX);
  const row = (Array.isArray(st.throttle) ? st.throttle : [])
    .find(r => r && r.key === k && r.day === day);
  return row ? H.N(row.n) : 0;
};

/**
 * Checked BEFORE the call, and never charged by checking. A blocked call is
 * worth logging as kapital_quota_block so the limits can be tuned against real
 * behaviour rather than guessed at twice.
 */
function check(st, key){
  const limit = limitFor(key), used = usedIn(st, key);
  if(used >= limit) return { ok: false, error: "throttle", used, limit, resets: resetsAt() };
  return { ok: true, used, limit };
}

/**
 * Charged only once the request actually reached the API. The rule in one line:
 * the quota tracks money SPENT, not answers received — so `ai_off` and a
 * transport failure charge nothing, while a refusal, an empty body and bad JSON
 * all charge one, because the tokens were billed either way. Rolling back on bad
 * JSON would make a malformed-response loop free to the founder and expensive to
 * the operator.
 */
function spend(st, key){
  prune(st);
  const day = today(), k = H.S(key, KEY_MAX);
  const row = st.throttle.find(r => r.key === k && r.day === day);
  if(row) row.n = H.N(row.n) + 1;
  else st.throttle.push({ key: k, day, n: 1 });
  return st;
}

/** How many calls of this family are left today. Never negative — a limit that
 *  was lowered under a founder mid-day should read as 0, not as a debt. */
const remaining = (st, key) => Math.max(0, limitFor(key) - usedIn(st, key));

module.exports = {
  LIMITS, TZ_OFFSET_MIN, KEY_MAX,
  today, resetsAt, dealKey, actorKey, limitFor, assertKeys,
  check, spend, remaining, prune,
};
