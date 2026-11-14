import { useEffect, useState } from "react";
import { PageBackground } from "../../shell/PageBackground";
import { readStored, removeStored } from "../../shell/storage";
import { useTheme } from "../../shell/useTheme";
import { AdminShell } from "./AdminShell";
import { seedDemoStore } from "./demoStore";
import { LoginForm } from "./LoginForm";

const SESSION_KEY = "kg_admin";

const hasSession = (): boolean => readStored("sessionStorage", SESSION_KEY) === "1";

/** The super-admin panel: the sign-in card until a session exists, then the shell. */
export function AdminPage() {
  const [isOpen, setIsOpen] = useState(hasSession);
  const { theme, toggleTheme } = useTheme();

  useEffect(seedDemoStore, []);

  /* The old panel reloaded the page here; dropping the shell gives the same
     result, the sign-in card and a panel that starts again from the dashboard. */
  const handleLogout = () => {
    removeStored("sessionStorage", SESSION_KEY);
    setIsOpen(false);
  };

  return (
    <>
      <PageBackground />
      {isOpen ? (
        <AdminShell theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
      ) : (
        <LoginForm onOpen={() => setIsOpen(true)} />
      )}
    </>
  );
}
