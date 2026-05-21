"use server";

import { revalidatePath } from "next/cache";

export async function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/public");
}

export async function revalidateSnippet(id: string) {
  revalidatePath(`/snippets/${id}`);
}
