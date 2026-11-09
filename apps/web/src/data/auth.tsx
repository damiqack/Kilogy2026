import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Result } from "antd";
import { Link, Navigate, useLocation } from "react-router-dom";

/**
 * Staff sign-in for the prototype. Only Kilogy administrators and developers sign in;
 * shippers use the public quote flow without an account.
 *
 * PROTOTYPE ONLY: accounts and passwords live in the browser so the flow can be demoed without
 * a backend. Real sign-in must be handled by the API gateway (hashed passwords, server-side
 * sessions or short-lived tokens). Never put real credentials in this file.
 */

export type Role = "admin" | "developer";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  team: string;
  phone: string;
  timeZone: string;
  language: "en" | "fr";
  joinedAt: string;
  twoFactor: boolean;
  notifications: Record<NotificationKey, boolean>;
}

export type NotificationKey = "exceptions" | "delayRisk" | "integrationErrors" | "weeklySummary";

export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", developer: "Developer" };

/** What each role can do; shown on the profile's Access tab. */
export const PERMISSIONS: { label: string; roles: Role[] }[] = [
  { label: "View all shipments and quotes", roles: ["admin", "developer"] },
  { label: "Create and manage API keys", roles: ["admin", "developer"] },
  { label: "Use the sandbox environment", roles: ["admin", "developer"] },
  { label: "View integration and webhook logs", roles: ["admin", "developer"] },
  { label: "Manage carrier integrations", roles: ["admin"] },
  { label: "Manage team members and roles", roles: ["admin"] },
  { label: "View billing and payments", roles: ["admin"] },
  { label: "Edit company settings", roles: ["admin"] },
];

const DEMO_PASSWORD = "kilogy-demo";

/** Demo accounts (reserved .test domain). Replace with the API's user directory. */
export const DEMO_ACCOUNTS: StaffUser[] = [
  {
    id: "usr_admin", name: "Yannick Nkayilu", email: "admin@kilogy.test", role: "admin", title: "Platform administrator",
    team: "Kilogy operations", phone: "", timeZone: "America/Toronto", language: "en", joinedAt: "2026-09-08", twoFactor: false,
    notifications: { exceptions: true, delayRisk: true, integrationErrors: true, weeklySummary: true },
  },
  {
    id: "usr_dev", name: "Jordan Lee", email: "dev@kilogy.test", role: "developer", title: "Integration engineer",
    team: "Platform engineering", phone: "", timeZone: "America/Los_Angeles", language: "en", joinedAt: "2026-09-15", twoFactor: false,
    notifications: { exceptions: false, delayRisk: false, integrationErrors: true, weeklySummary: true },
  },
];

export interface SignInRecord { at: string; device: string }

const SESSION_KEY = "kilogy.session";
const PROFILES_KEY = "kilogy.profiles";
const PASSWORDS_KEY = "kilogy.passwords";
const HISTORY_KEY = "kilogy.signins";

// Storage can be blocked (private windows); every read and write is wrapped.
function read<T>(store: Storage | undefined, key: string, fallback: T): T {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(store: Storage | undefined, key: string, value: unknown) {
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
const local = typeof window !== "undefined" ? window.localStorage : undefined;
const session = typeof window !== "undefined" ? window.sessionStorage : undefined;

function deviceName() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

interface Session { userId: string; signedInAt: string }

interface AuthValue {
  user: StaffUser | null;
  signedInAt: string | null;
  history: SignInRecord[];
  /** Sign-ins for every staff account, keyed by user id (used by admin reports). */
  allHistory: Record<string, SignInRecord[]>;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  updateProfile: (patch: Partial<StaffUser>) => void;
  changePassword: (current: string, next: string) => { ok: true } | { ok: false; error: string };
  team: StaffUser[];
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, Partial<StaffUser>>>(() => read(local, PROFILES_KEY, {}));
  const [current, setCurrent] = useState<Session | null>(() => read<Session | null>(local, SESSION_KEY, null) ?? read<Session | null>(session, SESSION_KEY, null));
  const [historyAll, setHistoryAll] = useState<Record<string, SignInRecord[]>>(() => read(local, HISTORY_KEY, {}));

  useEffect(() => write(local, PROFILES_KEY, profiles), [profiles]);
  useEffect(() => write(local, HISTORY_KEY, historyAll), [historyAll]);

  const team = useMemo(() => DEMO_ACCOUNTS.map((a) => ({ ...a, ...profiles[a.id], notifications: { ...a.notifications, ...profiles[a.id]?.notifications } })), [profiles]);
  const user = current ? team.find((u) => u.id === current.userId) ?? null : null;

  const signIn = useCallback<AuthValue["signIn"]>(async (email, password, remember) => {
    await new Promise((r) => setTimeout(r, 350));
    const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    const passwords = read<Record<string, string>>(local, PASSWORDS_KEY, {});
    if (!account || password !== (passwords[account.id] ?? DEMO_PASSWORD)) {
      return { ok: false, error: "That email and password don't match a Kilogy staff account." };
    }
    const s: Session = { userId: account.id, signedInAt: new Date().toISOString() };
    write(remember ? local : session, SESSION_KEY, s);
    write(remember ? session : local, SESSION_KEY, null);
    setCurrent(s);
    setHistoryAll((h) => ({ ...h, [account.id]: [{ at: s.signedInAt, device: deviceName() }, ...(h[account.id] ?? [])].slice(0, 10) }));
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    write(local, SESSION_KEY, null);
    write(session, SESSION_KEY, null);
    setCurrent(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<StaffUser>) => {
    if (!current) return;
    setProfiles((p) => ({ ...p, [current.userId]: { ...p[current.userId], ...patch } }));
  }, [current]);

  const changePassword = useCallback<AuthValue["changePassword"]>((oldPw, newPw) => {
    if (!current) return { ok: false, error: "Sign in first." };
    const passwords = read<Record<string, string>>(local, PASSWORDS_KEY, {});
    if (oldPw !== (passwords[current.userId] ?? DEMO_PASSWORD)) return { ok: false, error: "Your current password is incorrect." };
    write(local, PASSWORDS_KEY, { ...passwords, [current.userId]: newPw });
    return { ok: true };
  }, [current]);

  const value: AuthValue = {
    user, signedInAt: current?.signedInAt ?? null, history: user ? historyAll[user.id] ?? [] : [], allHistory: historyAll,
    signIn, signOut, updateProfile, changePassword, team,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Wrap a route element so only signed-in staff (optionally only some roles) can open it. */
export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <Result status="403" title={`${roles.map((r) => ROLE_LABEL[r]).join(" or ")} access only`}
        subTitle={`You're signed in as a ${ROLE_LABEL[user.role].toLowerCase()}. Ask an administrator if you need this page.`}
        extra={<Link to="/dashboard"><Button type="primary">Back to dashboard</Button></Link>} />
    );
  }
  return <>{children}</>;
}

export const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
