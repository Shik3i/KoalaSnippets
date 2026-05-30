"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Fingerprint,
  Key,
  Diff,
  Hash,
  Braces,
  FileKey,
  Binary,
  Regex,
  Clock,
  Link2,
  Palette,
  Image as ImageIcon,
  Sliders,
  Database,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  UuidTool,
  PasswordTool,
  DiffTool,
  HashTool,
  JsonTool,
  JwtTool,
  Base64Tool,
  RegexTool,
  TimestampTool,
  UrlTool,
  ColorTool,
  ImageConverterTool,
  CronTool,
  ShadowGeneratorTool,
  SqlFormatterTool,
} from "@/features/tools/components";

const tools = [
  { id: "uuid", icon: Fingerprint, title: "UUID Generator", description: "Generate UUIDv4 identifiers individually or in bulk.", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  { id: "password", icon: Key, title: "Password Generator", description: "Create strong passwords with custom length and character sets.", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { id: "diff", icon: Diff, title: "Text Diff Checker", description: "Compare two text inputs side-by-side with highlighting.", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  { id: "hash", icon: Hash, title: "Hash Generator", description: "Compute MD5, SHA-1, SHA-256, SHA-512 hashes via Web Crypto.", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { id: "json", icon: Braces, title: "JSON Formatter", description: "Beautify, minify, and validate JSON strings instantly.", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { id: "jwt", icon: FileKey, title: "JWT Decoder", description: "Decode JWT header and payload in your browser.", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  { id: "base64", icon: Binary, title: "Base64 Encoder", description: "Encode/decode Base64 entirely in the browser.", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "regex", icon: Regex, title: "Regex Tester", description: "Test regular expressions with live match highlighting and flags.", color: "text-pink-400", bgColor: "bg-pink-500/10" },
  { id: "timestamp", icon: Clock, title: "Timestamp Converter", description: "Convert Unix timestamps to human-readable dates and vice versa.", color: "text-teal-400", bgColor: "bg-teal-500/10" },
  { id: "url", icon: Link2, title: "URL Encoder / Decoder", description: "Encode and decode URLs, query parameters, and components.", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  { id: "color", icon: Palette, title: "Color Converter", description: "Convert between HEX, RGB, and HSL color formats with live preview.", color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10" },
  { id: "image", icon: ImageIcon, title: "Base64 Image Converter", description: "Convert images to Base64/Data URIs and render Base64 as images.", color: "text-sky-400", bgColor: "bg-sky-500/10" },
  { id: "cron", icon: Clock, title: "Cron Expression Tool", description: "Build and explain Cron schedule expressions in human-readable terms.", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  { id: "shadow", icon: Sliders, title: "CSS Shadow Generator", description: "Visually design CSS box-shadows and grab Tailwind v4 classes.", color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "sql", icon: Database, title: "SQL query Formatter", description: "Prettify, format, or compress SQL queries with clean tokenization.", color: "text-green-400", bgColor: "bg-green-500/10" },
] as const;

type ToolId = (typeof tools)[number]["id"];

const toolMeta: Record<ToolId, { icon: LucideIcon; title: string; color: string; bgColor: string }> = {
  uuid: { icon: Fingerprint, title: "UUID Generator", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  password: { icon: Key, title: "Password Generator", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  diff: { icon: Diff, title: "Text Diff Checker", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  hash: { icon: Hash, title: "Hash Generator", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  json: { icon: Braces, title: "JSON Formatter", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  jwt: { icon: FileKey, title: "JWT Decoder", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  base64: { icon: Binary, title: "Base64 Encoder / Decoder", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  regex: { icon: Regex, title: "Regex Tester", color: "text-pink-400", bgColor: "bg-pink-500/10" },
  timestamp: { icon: Clock, title: "Timestamp Converter", color: "text-teal-400", bgColor: "bg-teal-500/10" },
  url: { icon: Link2, title: "URL Encoder / Decoder", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  color: { icon: Palette, title: "Color Converter", color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10" },
  image: { icon: ImageIcon, title: "Base64 Image Converter", color: "text-sky-400", bgColor: "bg-sky-500/10" },
  cron: { icon: Clock, title: "Cron Expression Tool", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  shadow: { icon: Sliders, title: "CSS Shadow Generator", color: "text-red-400", bgColor: "bg-red-500/10" },
  sql: { icon: Database, title: "SQL query Formatter", color: "text-green-400", bgColor: "bg-green-500/10" },
};

function ToolsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTool = searchParams.get("tool") as ToolId | null;

  const handleSetActiveTool = (toolId: ToolId | null) => {
    const params = new URLSearchParams(searchParams);
    if (toolId) {
      params.set("tool", toolId);
    } else {
      params.delete("tool");
    }
    router.push(`?${params.toString()}`);
  };

  const renderTool = () => {
    switch (activeTool) {
      case "uuid": return <UuidTool />;
      case "password": return <PasswordTool />;
      case "diff": return <DiffTool />;
      case "hash": return <HashTool />;
      case "json": return <JsonTool />;
      case "jwt": return <JwtTool />;
      case "base64": return <Base64Tool />;
      case "regex": return <RegexTool />;
      case "timestamp": return <TimestampTool />;
      case "url": return <UrlTool />;
      case "color": return <ColorTool />;
      case "image": return <ImageConverterTool />;
      case "cron": return <CronTool />;
      case "shadow": return <ShadowGeneratorTool />;
      case "sql": return <SqlFormatterTool />;
    }
  };

  const meta = activeTool ? toolMeta[activeTool] : null;
  const MetaIcon = meta?.icon;

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
            <p className="text-muted-foreground">Privacy-first utilities. All computations run 100% in your browser. No data is ever sent to the server.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSetActiveTool(tool.id)}
                  className="group block text-left p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center mb-3`}>
                    <Icon size={20} className={tool.color} />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 pb-6 px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => handleSetActiveTool(null)} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                {MetaIcon && (
                  <div className={`w-10 h-10 rounded-lg ${meta!.bgColor} flex items-center justify-center`}>
                    <MetaIcon size={20} className={meta!.color} />
                  </div>
                )}
                <h2 className="text-xl font-bold">{meta?.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleSetActiveTool(null)} aria-label="Close">
                <X size={20} />
              </Button>
            </div>
            <div className="overflow-auto p-6 flex-1">
              {renderTool()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ToolsHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Developer Tools...</div>}>
      <ToolsHubContent />
    </Suspense>
  );
}
