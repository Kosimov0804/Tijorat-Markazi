type StorageArea = "localStorage" | "sessionStorage";

/* Private windows and blocked site data make these accessors throw. A missing
   preference must never take a page down, so every failure reads as "unset". */

export function readStored(area: StorageArea, key: string): string | null {
  try {
    return window[area].getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(area: StorageArea, key: string, value: string): void {
  try {
    window[area].setItem(key, value);
  } catch {
    /* The choice lasts for this page view only. */
  }
}

export function removeStored(area: StorageArea, key: string): void {
  try {
    window[area].removeItem(key);
  } catch {
    /* Nothing could be stored there in the first place. */
  }
}
