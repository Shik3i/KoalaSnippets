import { eq, like, or, and, exists, inArray, SQL, isNull, isNotNull, ne, not, gt, lt } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { snippets, snippetFiles, users, userFavorites } from "@/db/schema";
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
  isTrash?: boolean;
  authorUsername?: string;
  authorUsernameMode?: "include" | "exclude";
  pinned?: string;
  favorited?: string;
  minLines?: string;
  maxLines?: string;
  before?: string;
  after?: string;
  minFiles?: string;
  title?: string;
  currentUserId?: string;
}

export async function buildSnippetConditions(params: FilterParams): Promise<SQL[]> {
  const conditions: SQL[] = [];
  const filterMode = params.filterMode === "or" ? "or" : "and";

  // 1. Pinned Filter
  if (params.pinned === "true") {
    conditions.push(eq(snippets.isPinned, true));
  } else if (params.pinned === "false") {
    conditions.push(eq(snippets.isPinned, false));
  }

  // 2. Favorited Filter (by current user session)
  if (params.favorited === "true" && params.currentUserId) {
    conditions.push(
      exists(
        db.select()
          .from(userFavorites)
          .where(
            and(
              eq(userFavorites.snippetId, snippets.id),
              eq(userFavorites.userId, params.currentUserId)
            )
          )
      )
    );
  } else if (params.favorited === "false" && params.currentUserId) {
    conditions.push(
      not(
        exists(
          db.select()
            .from(userFavorites)
            .where(
              and(
                eq(userFavorites.snippetId, snippets.id),
                eq(userFavorites.userId, params.currentUserId)
              )
            )
        )
      )
    );
  }

  // 3. Line Count Filter (lines:>N or lines:<N)
  if (params.minLines) {
    const val = parseInt(params.minLines, 10);
    if (!isNaN(val)) {
      conditions.push(gt(snippets.totalLines, val));
    }
  }
  if (params.maxLines) {
    const val = parseInt(params.maxLines, 10);
    if (!isNaN(val)) {
      conditions.push(lt(snippets.totalLines, val));
    }
  }

  // 4. Date Range Filter (before:YYYY-MM-DD or after:YYYY-MM-DD)
  if (params.before) {
    const d = new Date(params.before);
    if (!isNaN(d.getTime())) {
      conditions.push(lt(snippets.createdAt, d));
    }
  }
  if (params.after) {
    const d = new Date(params.after);
    if (!isNaN(d.getTime())) {
      conditions.push(gt(snippets.createdAt, d));
    }
  }

  // 5. Multi-file Snippet Filter (has:files>N)
  if (params.minFiles) {
    const val = parseInt(params.minFiles, 10);
    if (!isNaN(val)) {
      conditions.push(
        exists(
          db.select()
            .from(snippetFiles)
            .where(eq(snippetFiles.snippetId, snippets.id))
            .groupBy(snippetFiles.snippetId)
            .having(sql`count(${snippetFiles.id}) > ${val}`)
        )
      );
    }
  }

  // 6. Title specific search (title:keyword)
  if (params.title) {
    const escapedTitle = escapeLike(params.title);
    conditions.push(like(snippets.title, `%${escapedTitle}%`));
  }

  if (params.authorId) {
    conditions.push(eq(snippets.authorId, params.authorId));
  }

  if (params.isTrash) {
    conditions.push(isNotNull(snippets.deletedAt));
  } else {
    conditions.push(isNull(snippets.deletedAt));
  }

  if (params.visibility) {
    conditions.push(eq(snippets.visibility, params.visibility));
  }

  if (params.collection) {
    conditions.push(eq(snippets.collectionId, params.collection));
  }

  if (params.authorUsername) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, params.authorUsername))
      .get();
    
    if (user) {
      if (params.authorUsernameMode === "exclude") {
        conditions.push(ne(snippets.authorId, user.id));
      } else {
        conditions.push(eq(snippets.authorId, user.id));
      }
    } else {
      if (params.authorUsernameMode !== "exclude") {
        // Safe way to represent a false statement in SQLite/Drizzle:
        conditions.push(sql`1 = 0`);
      }
    }
  }

  const filterGroup: SQL[] = [];

  // 1. Language Filter (supports comma-separated: "ts,python,rust,!java")
  if (params.language) {
    const langs = params.language.split(",").map(l => l.trim().toLowerCase()).filter(Boolean);
    const inclusiveLangs = langs.filter(l => !l.startsWith("!"));
    const exclusiveLangs = langs.filter(l => l.startsWith("!")).map(l => l.slice(1));

    // Handle inclusive languages (OR logic)
    if (inclusiveLangs.length === 1) {
      filterGroup.push(
        exists(
          db.select()
            .from(snippetFiles)
            .where(
              and(
                eq(snippetFiles.snippetId, snippets.id),
                eq(snippetFiles.language, inclusiveLangs[0])
              )
            )
        )
      );
    } else if (inclusiveLangs.length > 1) {
      filterGroup.push(
        exists(
          db.select()
            .from(snippetFiles)
            .where(
              and(
                eq(snippetFiles.snippetId, snippets.id),
                inArray(snippetFiles.language, inclusiveLangs)
              )
            )
        )
      );
    }

    // Handle exclusive languages (AND NOT logic)
    exclusiveLangs.forEach(lang => {
      filterGroup.push(
        not(
          exists(
            db.select()
              .from(snippetFiles)
              .where(
                and(
                  eq(snippetFiles.snippetId, snippets.id),
                  eq(snippetFiles.language, lang)
                )
              )
          )
        )
      );
    });
  }

  // 2. Tags Filter (comma-separated, AND or OR logic, supports ! prefix for exclusion)
  if (params.tags) {
    const filterTags = params.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const tagConditions = filterTags.map(tag => {
      const isExclude = tag.startsWith("!");
      const cleanTag = isExclude ? tag.slice(1) : tag;
      const pattern = `%${escapeLike(cleanTag)}%`;
      return isExclude
        ? sql`LOWER(snippets.tags) NOT LIKE ${pattern}`
        : sql`LOWER(snippets.tags) LIKE ${pattern}`;
    });

    if (filterMode === "or") {
      const tagOr = or(...tagConditions);
      if (tagOr) filterGroup.push(tagOr);
    } else {
      tagConditions.forEach(cond => {
        filterGroup.push(cond);
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
