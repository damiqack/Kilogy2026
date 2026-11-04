import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_USER } from "../config/navigation";

/**
 * The one place the app reads "who is signed in". Today that is the demo user, the email saved by
 * the sign-in page (localStorage "kilogy.demo.email"), and any profile edits saved in this browser.
 * When real auth exists, replace load() with the account from the API and keep the rest.
 */
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  /** Set by the account owner's admin, so the profile page shows it but does not edit it. */
  role: string;
  timezone: string;
  language: string;
  /** Uploaded photo as a data URL; empty means show initials. */
  avatar: string;
}

export type EditableProfile = Omit<UserProfile, "role">;

const PROFILE_KEY = "kilogy2026.web.profile.v1";
/** Written by pages/SignIn.tsx when "Remember email" is ticked. */
const SIGN_IN_EMAIL_KEY = "kilogy.demo.email";

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const nameFromEmail = (email: string) => titleCase(email.split("@")[0].replace(/[._-]+/g, " ").trim());

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function defaults(): UserProfile {
  let signInEmail = "";
  try {
    signInEmail = localStorage.getItem(SIGN_IN_EMAIL_KEY) ?? "";
  } catch {
    /* storage unavailable */
  }
  return {
    ...DEMO_USER,
    avatar: "",
    ...(signInEmail ? { email: signInEmail, name: nameFromEmail(signInEmail) || DEMO_USER.name } : {}),
  };
}

function load(): UserProfile {
  return { ...defaults(), ...(read<Partial<EditableProfile>>(PROFILE_KEY) ?? {}), role: DEMO_USER.role };
}

interface UserCtx {
  user: UserProfile;
  firstName: string;
  initials: string;
  updateUser: (patch: Partial<EditableProfile>) => void;
  resetUser: () => void;
}

const Ctx = createContext<UserCtx | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(load);

  useEffect(() => {
    try {
      const { role: _role, ...editable } = user;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(editable));
    } catch {
      /* quota exceeded or storage unavailable: edits last for this session only */
    }
  }, [user]);

  const updateUser = useCallback((patch: Partial<EditableProfile>) => setUser((u) => ({ ...u, ...patch })), []);
  const resetUser = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignore */
    }
    setUser({ ...defaults(), role: DEMO_USER.role });
  }, []);

  const value = useMemo<UserCtx>(() => ({
    user,
    firstName: user.name.trim().split(/\s+/)[0] || user.name,
    initials: initialsOf(user.name),
    updateUser,
    resetUser,
  }), [user, updateUser, resetUser]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentUser(): UserCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCurrentUser outside UserProvider");
  return v;
}
