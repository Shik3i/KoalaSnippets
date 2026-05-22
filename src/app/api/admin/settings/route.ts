import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSettingsSchema = z.object({
  registrationEnabled: z.boolean().optional(),
  globalAnnouncement: z.string().nullable().optional(),
  maxSnippetsPerUser: z.number().min(1).max(100000).optional(),
  maxCharsPerSnippet: z.number().min(1000).max(10000000).optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[Admin Settings API GET Error]", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await db.update(siteSettings).set(parsed.data).where(eq(siteSettings.id, 1));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Settings API PUT Error]", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
