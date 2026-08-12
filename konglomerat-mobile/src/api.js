import { API_BASE } from "../config";

// Tijorat Markazi server bilan aloqa (server.js dagi /api/* endpointlar)
async function post(path, body) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  } catch (e) {
    throw new Error("Serverga ulanib bo'lmadi. API_BASE va Wi-Fi'ni tekshiring.");
  }
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok || data.error) {
    throw new Error(data.error || `Xatolik (${res.status})`);
  }
  return data;
}

// ── Kompaniya (company) paneli ────────────────────────────────
export const api = {
  base: API_BASE,

  // Kirish. Javob: { company:{ id,name,sector,assocId,assocName,assocChairman,showroom,bizrows } }
  companyLogin: (login, password) =>
    post("/api/company/login", { login, password }),

  // Modul kartalari: invest | news | rnd. op: undefined(o'qish) | "add" | "del"
  companyItems: (auth, module, extra) =>
    post("/api/company/items", { ...auth, module, ...(extra || {}) }),

  // Kompaniyaga yo'llangan rasmiy xatlar
  companyLetters: (auth) => post("/api/company/letters", auth),

  // Showroom (mahsulot/xizmat katalogi) ni saqlash
  saveShowroom: (auth, items) =>
    post("/api/company/showroom", { ...auth, items }),

  // Soha bo'yicha AI yangiliklari
  sectorNews: (auth, lang) => post("/api/company/news", { ...auth, lang }),

  // Sotuv/mahsulot jadvalini saqlash + AI tahlil
  saveData: (auth, rows) => post("/api/company/data", { ...auth, rows }),
  analyze: (auth, lang) => post("/api/company/analyze", { ...auth, lang }),

  // Loyiha chati (kompaniya ↔ admin/rais)
  chat: (auth, op, text) => post("/api/company/chat", { ...auth, op, text }),

  // Onlayn uchrashuv (kompaniya o'z uyushmasi bo'yicha)
  conference: (assocId) =>
    fetch(`${API_BASE}/api/conference?assoc=${encodeURIComponent(assocId || "")}`)
      .then((r) => r.json())
      .catch(() => ({})),
};
