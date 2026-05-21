import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/utils/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID_APP_THEMES = ["theme-dark", "theme-midnight", "theme-hacker", "light"];
const VALID_SNIPPET_DENSITIES = ["compact", "preview", "full"];
const VALID_SYNTAX_THEMES = [
  "github-dark",
  "dracula",
  "nord",
  "poimandres",
  "github-light",
  "monokai",
];

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appTheme, snippetDensity, syntaxTheme } = body;

    // Validate inputs
    if (appTheme && !VALID_APP_THEMES.includes(appTheme)) {
      return NextResponse.json({ error: "Invalid app theme" }, { status: 400 });
    }

    if (snippetDensity && !VALID_SNIPPET_DENSITIES.includes(snippetDensity)) {
      return NextResponse.json({ error: "Invalid snippet density" }, { status: 400 });
    }

    if (syntaxTheme && !VALID_SYNTAX_THEMES.includes(syntaxTheme)) {
      return NextResponse.json({ error: "Invalid syntax highlighting theme" }, { status: 400 });
    }

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
