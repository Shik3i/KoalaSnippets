import { hashPassword, generateId } from "@/features/auth/utils/auth";
import { db } from "@/db";
import { users, siteStatistics } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function seedAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn("[seed] WARNING: ADMIN_USERNAME or ADMIN_PASSWORD is not set. Skipping admin user creation. Set these env vars to create an admin account.");
    return;
  }

  const existing = await db.select().from(users).where(eq(users.username, adminUsername)).get();
  if (existing) {
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  await db.insert(users).values({
    id: generateId(),
    username: adminUsername,
    passwordHash,
    role: "ADMIN",
    createdAt: new Date(),
    preferences: {
      appTheme: "theme-dark",
      snippetDensity: "compact",
      syntaxTheme: "github-dark",
      bgPattern: "flat",
    },
  });

  console.log(`[seed] Admin user "${adminUsername}" created`);
}

export async function seedStatistics() {
  const existing = await db.select().from(siteStatistics).where(eq(siteStatistics.id, 1)).get();
  if (existing) {
    return;
  }

  await db.insert(siteStatistics).values({
    id: 1,
    totalUsersCreated: 0,
    totalSnippetsCreated: 0,
  });

  console.log("[seed] Site statistics table initialized");
}
