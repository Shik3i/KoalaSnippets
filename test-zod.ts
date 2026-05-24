import { z } from "zod";
const snippetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).default("PRIVATE"),
});
const updateSnippetSchema = snippetSchema.partial();
console.log(updateSnippetSchema.parse({ title: "New" }));
