import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import { hashSessionToken, generateSessionToken } from "./auth";

const SESSION_COOKIE_NAME = "ks_session";
const SESSION_DURATION_DAYS = 30;
const SESSION_REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        username: users.username,
        role: users.role,
        preferences: users.preferences,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .get();

  if (!session) {
    return null;
  }

  // Gracefully normalize user preferences to ensure robust fallbacks for existing profiles
  if (session.user && session.user.preferences) {
    session.user.preferences = {
      appTheme: session.user.preferences.appTheme ?? "theme-dark",
      snippetDensity: session.user.preferences.snippetDensity ?? "compact",
      syntaxTheme: session.user.preferences.syntaxTheme ?? "github-dark",
      bgPattern: session.user.preferences.bgPattern ?? "flat",
    };
  }

  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  const now = Date.now();
  const expiresAtMs = session.expiresAt.getTime();
  if (expiresAtMs - now < SESSION_REFRESH_WINDOW_MS) {
    const newExpiresAt = new Date(now + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, session.id));
  }

  return session;
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const id = crypto.randomUUID();

  await db.insert(sessions).values({
    id,
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  });

  return token;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function cleanupExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
