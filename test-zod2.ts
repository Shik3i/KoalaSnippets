import { z } from "zod";
const snippetSchema = z.object({
  files: z.array(z.object({
    filename: z.string().trim().min(1).max(100),
    code: z.string().trim().min(1),
    language: z.string().trim().min(1).max(50)
  })).min(1).optional()
});
const updateSnippetSchema = snippetSchema.partial();
console.log(updateSnippetSchema.parse({ files: [{ filename: "test.ts" }] }));
