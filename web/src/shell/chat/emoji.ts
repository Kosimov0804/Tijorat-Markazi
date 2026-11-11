/* Plain Unicode, drawn by whatever emoji font the reader's device has. Copied
   from chat-kit.js: a tab glyph, then the characters under it. */
const GROUPS: readonly (readonly [string, string])[] = [
  ["😀", "😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥳😏😒😞😔😟😕🙁😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠"],
  ["👍", "👍👎👌🤌🤏✌️🤞🤟🤘🤙👈👉👆👇☝️✋🤚🖐️🖖👋🤝🙏✍️💪🦾🙌👏🤲🫶❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝"],
  ["🏢", "🏢🏬🏭🏗️🏘️🏛️🕌🕍⛪🏰🏯🗼🌉🚗🚕🚙🚌🚚🚛✈️🚀🛳️⛵🚢⚓🗺️🧭🌍🌏🌎"],
  ["📦", "📦📫📬📭📮📝📄📃📑📊📈📉🗒️🗓️📅📆🗂️📁📂🔖🏷️💼👔🧾💳💰💵💴💶💷🪙💸🧮⚖️🤝🎯🏆🥇🎁"],
  ["🍎", "🍎🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶️🌽🥕🧄🧅🥔🍠🌾🌱🌿☘️🍀🪴🌸🌺🌻🌷🌹"],
  ["⏰", "⏰⏱️⌛⏳✅❌⭕❗❓💡🔔🔕📌📍🔗🔒🔓🔑🗝️🔍🔎⚙️🛠️🔧📱💻🖥️⌨️🖨️📞☎️📧✉️🌐"],
];

/* Joiners and variation selectors sit between the glyphs and are not buttons. */
const FIRST_GLYPH_CODE_POINT = 0x2000;

export interface EmojiCategory {
  tab: string;
  glyphs: readonly string[];
}

export const EMOJI_CATEGORIES: readonly EmojiCategory[] = GROUPS.map(([tab, glyphs]) => ({
  tab,
  glyphs: Array.from(glyphs).filter(glyph => (glyph.codePointAt(0) ?? 0) > FIRST_GLYPH_CODE_POINT),
}));
