import { eq, like, or, and, inArray, SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { snippets, snippetFiles } from "@/db/schema";
import { db } from "@/db";
import { escapeLike } from "@/features/core/utils/sql";

interface FilterParams {
  q?: string;
  includeCode?: string;
  tags?: string;
  language?: string;
  collection?: string;
  authorId?: string;
  visibility?: "PRIVATE" | "SHARED" | "PUBLIC";
}

export async function buildSnippetConditions(params: FilterParams): Promise<SQL[]> {
  const conditions: SQL[] = [];

  if (params.authorId) {
    conditions.push(eq(snippets.authorId, params.authorId));
  }

  if (params.visibility) {
    conditions.push(eq(snippets.visibility, params.visibility));
  }

  if (params.collection) {
    conditions.push(eq(snippets.collectionId, params.collection));
  }

  // 1. Language Filter
  if (params.language) {
    const langSnippetIds = await db.select({ snippetId: snippetFiles.snippetId })
      .from(snippetFiles)
      .where(eq(snippetFiles.language, params.language))
      .all();
    const langIds = langSnippetIds.map(f => f.snippetId);
    if (langIds.length > 0) {
      conditions.push(inArray(snippets.id, langIds));
    } else {
      conditions.push(eq(snippets.id, "nonexistent-id")); // Force empty result
    }
  }

  // 2. Tags Filter (AND logic for each comma-separated tag)
  if (params.tags) {
    const filterTags = params.tags.split(",").map(t => t.trim()).filter(Boolean);
    filterTags.forEach(tag => {
      conditions.push(sql`snippets.tags LIKE ${`%"${tag}"%`}`);
    });
  }

  // 3. Text Search Query
  if (params.q) {
    const escapedQuery = escapeLike(params.q);
    const includeCodeBool = params.includeCode === "true";

    const matchingSnippetIds = new Set<string>();
    let fileQuery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
      .where(like(snippetFiles.language, `%${escapedQuery}%`));
    
    if (includeCodeBool) {
      fileQuery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
        .where(or(
          like(snippetFiles.language, `%${escapedQuery}%`),
          like(snippetFiles.code, `%${escapedQuery}%`)
        ));
    }
    
    const matchedFiles = await fileQuery.all();
    matchedFiles.forEach(f => matchingSnippetIds.add(f.snippetId));

    const searchConditions: SQL[] = [
      like(snippets.title, `%${escapedQuery}%`),
      sql`snippets.tags LIKE ${`%${escapedQuery}%`}`,
    ];
    if (matchingSnippetIds.size > 0) {
      searchConditions.push(inArray(snippets.id, Array.from(matchingSnippetIds)));
    }
    
    conditions.push(or(...searchConditions)!);
  }

  return conditions;
}
