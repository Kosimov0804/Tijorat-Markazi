import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const KEY = "konglomerat.session";
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [creds, setCreds] = useState(null);   // { login, password }
  const [company, setCompany] = useState(null);

  // Ilova ochilganda saqlangan sessiyani tiklash
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s?.login) {
            // Sessiyani serverda qayta tekshiramiz
            const r = await api.companyLogin(s.login, s.password);
            setCreds({ login: s.login, password: s.password });
            setCompany(r.company);
          }
        }
      } catch {
        // jim: kirish ekraniga qaytamiz
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(login, password) {
    const r = await api.companyLogin(login, password);
    const c = { login, password };
    setCreds(c);
    setCompany(r.company);
    await AsyncStorage.setItem(KEY, JSON.stringify(c));
    return r.company;
  }

  async function logout() {
    setCreds(null);
    setCompany(null);
    await AsyncStorage.removeItem(KEY);
  }

  return (
    <AuthCtx.Provider value={{ loading, creds, company, setCompany, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
