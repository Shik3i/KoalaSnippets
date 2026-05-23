import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/utils/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyCsrf } from "@/features/core/utils/security";

export const dynamic = "force-dynamic";

const appearanceSettingsSchema = z.object({
  appTheme: z.enum([
    "theme-dark",
    "theme-midnight",
    "theme-hacker",
    "light",
    "theme-nord",
    "theme-dracula",
    "theme-terracotta",
  ]).optional(),
  snippetDensity: z.enum(["compact", "preview", "full"]).optional(),
  syntaxTheme: z.enum([
    "github-dark",
    "dracula",
    "nord",
    "poimandres",
    "github-light",
    "monokai",
  ]).optional(),
  bgPattern: z.enum(["flat", "dots", "grid", "gradient", "drift", "aurora", "silk", "topo", "nodes", "hex", "matrix", "circuit"]).optional(),
});

export async function PUT(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = appearanceSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid appearance settings payload" }, { status: 400 });
    }

    const { appTheme, snippetDensity, syntaxTheme, bgPattern } = parsed.data;

    // Merge with existing preferences or fallback to defaults
    const currentPrefs = session.user.preferences || {
      appTheme: "theme-midnight",
      snippetDensity: "preview",
      syntaxTheme: "github-dark",
      bgPattern: "matrix",
    };

    const updatedPrefs = {
      appTheme: appTheme ?? currentPrefs.appTheme ?? "theme-midnight",
      snippetDensity: snippetDensity ?? currentPrefs.snippetDensity ?? "preview",
      syntaxTheme: syntaxTheme ?? currentPrefs.syntaxTheme ?? "github-dark",
      bgPattern: bgPattern ?? currentPrefs.bgPattern ?? "matrix",
    };

    // Update in database
    await db
      .update(users)
      .set({ preferences: updatedPrefs })
      .where(eq(users.id, session.user.id))
      .run();

    return NextResponse.json({ success: true, preferences: updatedPrefs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    console.error("Failed to update appearance settings:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
