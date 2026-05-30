"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Braces, Code, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveToSnippetButton } from "./save-to-snippet-button";
import { useToolHistory } from "../hooks/use-tool-history";
import { useI18n } from "@/features/core/i18n";

export function JsonToTsTool() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const [mode, setMode] = useState<"ts" | "zod">("ts");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { history, addToHistory, clearHistory } = useToolHistory<{
    input: string;
    rootName: string;
    mode: "ts" | "zod";
  }>("koalatools_history_json_to_ts", 10);

  const generate = (jsonStr: string, name: string, genMode: "ts" | "zod") => {
    setError("");
    setOutput("");

    if (!jsonStr.trim()) return;

    try {
      const parsed = JSON.parse(jsonStr);
      const cleanName = name.trim().replace(/[^a-zA-Z0-9]/g, "") || "Root";
      
      let generated = "";
      if (genMode === "ts") {
        generated = generateTypeScript(parsed, cleanName);
      } else {
        generated = generateZod(parsed, cleanName);
      }
      
      setOutput(generated);
      addToHistory({ input: jsonStr, rootName: name, mode: genMode });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      generate(input, rootName, mode);
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, rootName, mode]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">JSON Input</label>
              {error ? (
                <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 max-w-[200px] truncate" title={error}>
                  Error
                </span>
              ) : input.trim() ? (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Valid JSON
                </span>
              ) : null}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistoryOpen(!historyOpen)}
                className="h-8 gap-1.5 text-xs"
              >
                <History size={14} />
                <span>{historyOpen ? "Hide History" : `History (${history.length})`}</span>
              </Button>
            </div>
          </div>

          {historyOpen && history.length > 0 && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">{t.toolHistory}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearHistory}
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  title={t.toolHistoryClear}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
              <div className="space-y-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setInput(item.payload.input);
                      setRootName(item.payload.rootName);
                      setMode(item.payload.mode);
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-card hover:bg-accent border border-border rounded text-xs flex justify-between items-center group transition-colors"
                  >
                    <span className="font-mono truncate max-w-[200px]">
                      {item.payload.input.slice(0, 30)}...
                    </span>
                    <span className="text-[10px] opacity-75 font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {item.payload.mode === "ts" ? "TS" : "Zod"}: {item.payload.rootName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste JSON here e.g. { "id": 1, "name": "Koala" }'
            className="w-full min-h-[300px] h-[400px] p-4 bg-muted/30 border border-border rounded-xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Output Column */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold">Generated Output</label>
              <div className="flex rounded-lg border border-border overflow-hidden h-7">
                <button
                  onClick={() => setMode("ts")}
                  className={`px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    mode === "ts" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code size={12} />
                  TypeScript
                </button>
                <button
                  onClick={() => setMode("zod")}
                  className={`px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    mode === "zod" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Braces size={12} />
                  Zod
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Root Name:</label>
              <input
                type="text"
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                className="w-24 px-2 py-1 bg-card border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="relative group w-full min-h-[300px] h-[400px]">
            <textarea
              readOnly
              value={output}
              placeholder="TS interfaces or Zod schemas will generate here automatically..."
              className="w-full h-full p-4 bg-muted/50 border border-border rounded-xl font-mono text-sm resize-none focus:outline-none"
            />
            {output && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <SaveToSnippetButton
                  code={output}
                  language={mode === "ts" ? "typescript" : "typescript"}
                  defaultTitle={rootName}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="bg-card border border-border hover:bg-accent h-9 w-9"
                  title="Copy Code"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Recursive TypeScript Interface Generator
// ----------------------------------------------------
function generateTypeScript(val: unknown, rootName: string): string {
  const interfaces: string[] = [];

  function inferType(obj: unknown, name: string): string {
    if (obj === null) return "any";
    if (typeof obj !== "object") return typeof obj;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "any[]";
      const itemTypes = Array.from(new Set(obj.map((item) => inferType(item, name + "Item"))));
      const arrayType = itemTypes.join(" | ");
      return itemTypes.length > 1 ? `(${arrayType})[]` : `${arrayType}[]`;
    }

    // Object type -> Create nested interface
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    const properties: string[] = [];
    
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const isIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
      const safeKey = isIdentifier ? key : `"${key}"`;
      const propertyName = name + key.charAt(0).toUpperCase() + key.slice(1);
      properties.push(`  ${safeKey}: ${inferType(record[key], propertyName)};`);
    }

    const interfaceBody = `export interface ${capitalizedName} {\n${properties.join("\n")}\n}`;
    interfaces.unshift(interfaceBody); // Put dependency first
    
    return capitalizedName;
  }

  inferType(val, rootName);
  
  // Clean up order and return
  return interfaces.reverse().join("\n\n");
}

// ----------------------------------------------------
// Recursive Zod Schema Generator
// ----------------------------------------------------
function generateZod(val: unknown, rootName: string): string {
  const schemas: string[] = [];

  function inferZod(obj: unknown, name: string): string {
    if (obj === null) return "z.any()";
    if (typeof obj === "string") return "z.string()";
    if (typeof obj === "number") return "z.number()";
    if (typeof obj === "boolean") return "z.boolean()";
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "z.array(z.any())";
      const itemSchema = inferZod(obj[0], name + "Item");
      return `z.array(${itemSchema})`;
    }

    // Object type -> Create z.object
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    const properties: string[] = [];
    
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const isIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
      const safeKey = isIdentifier ? key : `"${key}"`;
      const propertyName = name + key.charAt(0).toUpperCase() + key.slice(1);
      properties.push(`  ${safeKey}: ${inferZod(record[key], propertyName)},`);
    }

    const schemaDeclaration = `export const ${capitalizedName.charAt(0).toLowerCase() + capitalizedName.slice(1)}Schema = z.object({\n${properties.join("\n")}\n});`;
    schemas.unshift(schemaDeclaration);
    
    return `${capitalizedName.charAt(0).toLowerCase() + capitalizedName.slice(1)}Schema`;
  }

  inferZod(val, rootName);

  // Prepend import and return
  return `import { z } from "zod";\n\n` + schemas.reverse().join("\n\n");
}
