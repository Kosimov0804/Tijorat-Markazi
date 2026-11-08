import { useCallback, useState } from "react";
import { readStored, removeStored } from "./storage";

/* Most privileged first: rais and admin share the admin panel. */
const PANELS = [
  { key: "kg_admin", url: "admin.html" },
  { key: "kg_rais", url: "admin.html" },
  { key: "kg_as", url: "association.html" },
  { key: "kg_co", url: "company.html" },
  { key: "kg_an", url: "tahlil.html" },
  { key: "kg_by", url: "xaridor.html" },
] as const;

const ALL_SESSION_KEYS = [...PANELS.map(panel => panel.key), "kg_email", "kg_guest_id", "kg_demo_email"];

function currentPanel(): string | null {
  const match = PANELS.find(
    ({ key }) => readStored("sessionStorage", key) || readStored("localStorage", key),
  );
  return match ? match.url : null;
}

interface Account {
  /** The cabinet this session belongs to, or null when signed out. */
  panelUrl: string | null;
  logout: () => void;
}

export function useAccount(): Account {
  const [panelUrl] = useState(currentPanel);

  const logout = useCallback(() => {
    ALL_SESSION_KEYS.forEach(key => {
      removeStored("sessionStorage", key);
      removeStored("localStorage", key);
    });
    window.location.href = "assistant.html";
  }, []);

  return { panelUrl, logout };
}
