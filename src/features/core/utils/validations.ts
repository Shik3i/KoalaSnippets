import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@/features/snippets/utils/shiki";

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8).regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8).regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[0-9]/, "Password must contain a number"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export const snippetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  code: z.string().trim().min(1).optional(),
  language: z.string().trim().min(1).max(50).refine(
    (lang) => SUPPORTED_LANGUAGES.includes(lang),
    { message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}` }
  ).optional(),
  files: z.array(z.object({
    filename: z.string().trim().min(1).max(100),
    code: z.string().trim().min(1),
    language: z.string().trim().min(1).max(50).refine(
      (lang) => SUPPORTED_LANGUAGES.includes(lang),
      { message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}` }
    )
  })).min(1).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).default("PRIVATE"),
  collectionId: z.string().nullable().optional(),
  expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
  password: z.string().nullable().optional(),
});

export const updateSnippetSchema = snippetSchema.partial();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type SnippetInput = z.infer<typeof snippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
