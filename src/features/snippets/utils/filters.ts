import { eq, like, or, and, exists, inArray, SQL } from "drizzle-orm";
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
  filterMode?: string;
}

export async function buildSnippetConditions(params: FilterParams): Promise<SQL[]> {
  const conditions: SQL[] = [];
  const filterMode = params.filterMode === "or" ? "or" : "and";

  if (params.authorId) {
    conditions.push(eq(snippets.authorId, params.authorId));
  }

  if (params.visibility) {
    conditions.push(eq(snippets.visibility, params.visibility));
  }

  if (params.collection) {
    conditions.push(eq(snippets.collectionId, params.collection));
  }

  const filterGroup: SQL[] = [];

  // 1. Language Filter (supports comma-separated: "ts,python,rust")
  if (params.language) {
    const langs = params.language.split(",").map(l => l.trim().toLowerCase()).filter(Boolean);
    if (langs.length === 1) {
      filterGroup.push(
        exists(
          db.select()
            .from(snippetFiles)
            .where(
              and(
                eq(snippetFiles.snippetId, snippets.id),
                eq(snippetFiles.language, langs[0])
              )
            )
        )
      );
    } else if (langs.length > 1) {
      filterGroup.push(
        exists(
          db.select()
            .from(snippetFiles)
            .where(
              and(
                eq(snippetFiles.snippetId, snippets.id),
                inArray(snippetFiles.language, langs)
              )
            )
        )
      );
    }
  }

  // 2. Tags Filter (comma-separated, AND or OR logic)
  if (params.tags) {
    const filterTags = params.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    if (filterMode === "or") {
      const tagConditions = filterTags.map(tag =>
        sql`LOWER(snippets.tags) LIKE ${`%${escapeLike(tag)}%`}`
      );
      const tagOr = or(...tagConditions);
      if (tagOr) filterGroup.push(tagOr);
    } else {
      filterTags.forEach(tag => {
        filterGroup.push(sql`LOWER(snippets.tags) LIKE ${`%${escapeLike(tag)}%`}`);
      });
    }
  }

  if (filterGroup.length > 0) {
    const filterClause = filterMode === "or" ? or(...filterGroup) : and(...filterGroup);
    if (filterClause) conditions.push(filterClause);
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
