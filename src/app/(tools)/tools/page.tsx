"use client";

import Link from "next/link";
import {
  Fingerprint,
  Key,
  Diff,
  Hash,
  Braces,
  FileKey,
  Binary,
  ArrowLeft,
} from "lucide-react";

const tools = [
  {
    href: "/tools/uuid",
    icon: Fingerprint,
    title: "UUID Generator",
    description: "Generate UUIDv4 identifiers individually or in bulk. Export as plain text, SQL, or JSON arrays.",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    href: "/tools/password",
    icon: Key,
    title: "Password Generator",
    description: "Create strong passwords with custom length, character sets, and ambiguous character exclusion.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    href: "/tools/diff",
    icon: Diff,
    title: "Text Diff Checker",
    description: "Compare two text inputs side-by-side with line-level and character-level difference highlighting.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    href: "/tools/hash",
    icon: Hash,
    title: "Hash Generator",
    description: "Compute MD5, SHA-1, SHA-256, SHA-512 hashes of any text input using the Web Crypto API.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    href: "/tools/json",
    icon: Braces,
    title: "JSON Formatter",
    description: "Beautify, minify, and validate JSON strings. Locate and highlight syntax errors instantly.",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    href: "/tools/jwt",
    icon: FileKey,
    title: "JWT Decoder",
    description: "Decode and inspect JWT header and payload without sending tokens to any external server.",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  {
    href: "/tools/base64",
    icon: Binary,
    title: "Base64 Encoder",
    description: "Encode text to Base64 or decode Base64 strings back to plain text. Works entirely in the browser.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
];

export default function ToolsHubPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
          <p className="text-muted-foreground">
            Privacy-first utilities. All computations run 100% in your browser.
            No data is ever sent to the server.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group block p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center mb-3`}>
                  <Icon size={20} className={tool.color} />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
