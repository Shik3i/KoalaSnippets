import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/utils/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const appearanceSettingsSchema = z.object({
  appTheme: z.enum(["theme-dark", "theme-midnight", "theme-hacker", "light"]).optional(),
  snippetDensity: z.enum(["compact", "preview", "full"]).optional(),
  syntaxTheme: z.enum([
    "github-dark",
    "dracula",
    "nord",
    "poimandres",
    "github-light",
    "monokai",
  ]).optional(),
});

export async function PUT(request: Request) {
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

    const { appTheme, snippetDensity, syntaxTheme } = parsed.data;

    // Merge with existing preferences or fallback to defaults
    const currentPrefs = session.user.preferences || {
      appTheme: "theme-dark",
      snippetDensity: "compact",
      syntaxTheme: "github-dark",
    };

    const updatedPrefs = {
      appTheme: appTheme ?? currentPrefs.appTheme,
      snippetDensity: snippetDensity ?? currentPrefs.snippetDensity,
      syntaxTheme: syntaxTheme ?? currentPrefs.syntaxTheme,
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
