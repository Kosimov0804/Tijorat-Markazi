import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { T } from "@legacy/data.js";
import { T_MOLIYA } from "@legacy/markets-i18n.js";
import { T_MS_INV } from "@legacy/moliya-investor-i18n.js";
import { T_MS } from "@legacy/moliya-scoring-i18n.js";
import { T_HUB } from "../pages/moliya/hubText";
import { T_DSR } from "@legacy/dsr-i18n.js";
import { T_BREG, T_REGISTER } from "@legacy/markets-i18n.js";
import { T_BIZID, T_KORXONA, T_MK, T_PRODUCT } from "@legacy/markets-i18n.js";
import { T_BOZOR, T_MEHNAT } from "@legacy/markets-i18n.js";
import { T_ANALYST, T_XARIDOR } from "@legacy/markets-i18n.js";

const SRC = path.resolve(__dirname, "..");
const KEY_PATTERN = /\bt\("([a-zA-Z0-9_]+)"\)|\b(?:labelKey|eyebrowKey|headingKey|bodyKey)[:=]\s*\{?"([a-zA-Z0-9_]+)"/g;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [full] : [];
  });
}

describe("translation keys", () => {
  it("resolves every key used in the React source against the shared dictionary", () => {
    // Arrange
    const used = sourceFiles(SRC).flatMap(file =>
      [...readFileSync(file, "utf8").matchAll(KEY_PATTERN)].map(match => match[1] ?? match[2]),
    );

    // Act
    const known = { ...T, ...T_BOZOR, ...T_MEHNAT, ...T_REGISTER, ...T_BREG, ...T_DSR, ...T_MK, ...T_KORXONA, ...T_PRODUCT, ...T_BIZID, ...T_MOLIYA, ...T_MS, ...T_MS_INV, ...T_HUB, ...T_ANALYST, ...T_XARIDOR };
    const missing = [...new Set(used)].filter(key => !known[key]);

    // Assert
    expect(used.length).toBeGreaterThan(20);
    expect(missing).toEqual([]);
  });
});
