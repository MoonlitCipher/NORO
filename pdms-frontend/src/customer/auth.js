const ACCOUNTS = "noro.accounts";
const SESSION = "noro.session";

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };
const digits = (value) => value.replace(/\D/g, "").slice(-10);
const matches = (account, identity) => {
  const id = identity.trim().toLowerCase();
  return account.email.toLowerCase() === id || (digits(id).length === 10 && digits(account.phone) === digits(id));
};

const DEFAULT_ACCOUNTS = [
  { name: "Test User", email: "test@example.com", phone: "9876543210", password: "Password123", joined: "2026-01-15T10:00:00.000Z" }
];

export function registerAccount({ name, email, phone, password }) {
  const accounts = read(ACCOUNTS, DEFAULT_ACCOUNTS);
  if (accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) return { error: "email", message: "An account with this email already exists." };
  if (accounts.some((a) => digits(a.phone) === digits(phone))) return { error: "identity", message: "An account with this mobile number already exists." };
  write(ACCOUNTS, [...accounts, { name: name.trim(), email: email.trim(), phone: phone.trim(), password, joined: new Date().toISOString() }]);
  return { ok: true };
}

export function loginAccount(identity, password) {
  const accounts = read(ACCOUNTS, DEFAULT_ACCOUNTS);
  const account = accounts.find((a) => matches(a, identity));
  if (!account) return { error: "identity", message: "No account found. Check your details or create one." };
  if (account.password !== password) return { error: "password", message: "Incorrect password." };
  const user = { ...account };
  delete user.password;
  write(SESSION, user);
  return { ok: true, user };
}

export function loginWithEmailVerified(email) {
  const accounts = read(ACCOUNTS, DEFAULT_ACCOUNTS);
  const trimmed = email.trim().toLowerCase();
  let account = accounts.find((a) => a.email.toLowerCase() === trimmed);
  if (!account) {
    const rawDerived = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const derivedName = (!rawDerived || /mantraa/i.test(rawDerived)) ? "Test User" : rawDerived;
    account = {
      name: derivedName,
      email: email.trim(),
      phone: "9876543210",
      joined: new Date().toISOString(),
    };
    write(ACCOUNTS, [...accounts, account]);
  }
  const user = { ...account };
  delete user.password;
  if (/mantraa/i.test(user.name || "")) {
    user.name = "Test User";
  }
  write(SESSION, user);
  return { ok: true, user };
}

export const getSession = () => {
  const session = read(SESSION, null);
  if (session && (/mantraa/i.test(session.name || "") || /mantraa/i.test(session.email || ""))) {
    session.name = "Test User";
    session.email = "test@example.com";
    session.phone = "9876543210";
    write(SESSION, session);
  }
  return session;
};
export const clearSession = () => { try { localStorage.removeItem(SESSION); } catch { /* ignore */ } };


