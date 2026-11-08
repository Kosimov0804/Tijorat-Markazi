const NEW_TO_OLD: Readonly<Record<string, string>> = { ö: "o'", ğ: "g'", ş: "sh", ç: "ch" };

/**
 * Lets a search match either spelling. Text companies have already entered
 * keeps the previous alphabet, while visitors may type the 2026 letters.
 */
export function foldUzbek(text: string): string {
  return text
    .toLowerCase()
    .replace(/[öğşç]/g, letter => NEW_TO_OLD[letter])
    .replace(/[‘’ʻʼ`´]/g, "'");
}
