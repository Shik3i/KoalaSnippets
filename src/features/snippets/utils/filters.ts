import { eq, like, or, and, exists, SQL } from "drizzle-orm";
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

  // 1. Language Filter (Optimized via EXISTS subquery)
  if (params.language) {
    conditions.push(
      exists(
        db.select()
          .from(snippetFiles)
          .where(
            and(
              eq(snippetFiles.snippetId, snippets.id),
              eq(snippetFiles.language, params.language)
            )
          )
      )
    );
  }

  // 2. Tags Filter (AND logic for each comma-separated tag)
  if (params.tags) {
    const filterTags = params.tags.split(",").map(t => t.trim()).filter(Boolean);
    filterTags.forEach(tag => {
      conditions.push(sql`snippets.tags LIKE ${`%${escapeLike(tag)}%`}`);
    });
  }

  // 3. Text Search Query (Optimized via EXISTS subquery for files search)
  if (params.q) {
    const escapedQuery = escapeLike(params.q);
    const includeCodeBool = params.includeCode === "true";

    const searchConditions: SQL[] = [
      like(snippets.title, `%${escapedQuery}%`),
      sql`snippets.tags LIKE ${`%${escapedQuery}%`}`,
    ];

    const fileSearch = exists(
      db.select()
        .from(snippetFiles)
        .where(
          and(
            eq(snippetFiles.snippetId, snippets.id),
            includeCodeBool
              ? or(
                  like(snippetFiles.language, `%${escapedQuery}%`),
                  like(snippetFiles.code, `%${escapedQuery}%`)
                )
              : like(snippetFiles.language, `%${escapedQuery}%`)
          )
        )
    );
    searchConditions.push(fileSearch);
    
    conditions.push(or(...searchConditions)!);
  }

  return conditions;
}
