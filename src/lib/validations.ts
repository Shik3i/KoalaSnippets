import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8).regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const snippetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  code: z.string().min(1),
  language: z.string().min(1).max(50),
  tags: z.array(z.string().max(50)).max(10).optional(),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).default("PRIVATE"),
});

export const updateSnippetSchema = snippetSchema.partial();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SnippetInput = z.infer<typeof snippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
