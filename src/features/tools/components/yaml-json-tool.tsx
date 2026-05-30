"use client";

import { useState, useEffect } from "react";
import { Copy, Check, ArrowLeftRight, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveToSnippetButton } from "./save-to-snippet-button";
import { useToolHistory } from "../hooks/use-tool-history";
import { useI18n } from "@/features/core/i18n";
import YAML from "yaml";

export function YamlJsonTool() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"yaml2json" | "json2yaml">("yaml2json");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { history, addToHistory, clearHistory } = useToolHistory<{
    input: string;
    mode: "yaml2json" | "json2yaml";
  }>("koalatools_history_yaml_json", 10);

  const convert = (str: string, currentMode: "yaml2json" | "json2yaml") => {
    setError("");
    setOutput("");

    if (!str.trim()) return;

    try {
      if (currentMode === "yaml2json") {
        // Parse YAML -> Stringify JSON
        const parsed = YAML.parse(str);
        if (parsed === undefined) {
          throw new Error("Empty YAML or parsed as undefined");
        }
        setOutput(JSON.stringify(parsed, null, 2));
      } else {
        // Parse JSON -> Stringify YAML
        const parsed = JSON.parse(str);
        setOutput(YAML.stringify(parsed));
      }
      addToHistory({ input: str, mode: currentMode });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parsing / Conversion failed");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      convert(input, mode);
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "yaml2json" ? "json2yaml" : "yaml2json"));
    setInput(output); // swap inputs
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">
                {mode === "yaml2json" ? "YAML Input" : "JSON Input"}
              </label>
              {error ? (
                <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 max-w-[200px] truncate" title={error}>
                  Error
                </span>
              ) : input.trim() ? (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Valid Format
                </span>
              ) : null}
            </div>

            <div className="flex gap-2 items-center">
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
                      setMode(item.payload.mode);
                    }}
                    className="w-full text-left px-2.5 py-1.5 bg-card hover:bg-accent border border-border rounded text-xs flex justify-between items-center group transition-colors"
                  >
                    <span className="font-mono truncate max-w-[250px]">
                      {item.payload.input.slice(0, 35)}...
                    </span>
                    <span className="text-[10px] opacity-75 font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                      {item.payload.mode === "yaml2json" ? "YAML → JSON" : "JSON → YAML"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "yaml2json"
                ? "type: koala\nfeatures:\n  - easy\n  - client-side"
                : '{ "type": "koala", "features": ["easy", "client-side"] }'
            }
            className="w-full min-h-[300px] h-[400px] p-4 bg-muted/30 border border-border rounded-xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action / Swap & Output Column */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold">
                {mode === "yaml2json" ? "JSON Output" : "YAML Output"}
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleMode}
                className="h-7 gap-1 text-xs px-2 border-border/80"
                title="Swap Input/Output Mode"
              >
                <ArrowLeftRight size={12} />
                <span>Swap Mode</span>
              </Button>
            </div>

            <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
              {mode === "yaml2json" ? "YAML ➔ JSON" : "JSON ➔ YAML"}
            </div>
          </div>

          <div className="relative group w-full min-h-[300px] h-[400px]">
            <textarea
              readOnly
              value={output}
              placeholder="Conversion results will render automatically..."
              className="w-full h-full p-4 bg-muted/50 border border-border rounded-xl font-mono text-sm resize-none focus:outline-none"
            />
            {output && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <SaveToSnippetButton
                  code={output}
                  language={mode === "yaml2json" ? "json" : "yaml"}
                  defaultTitle={mode === "yaml2json" ? "converted-json" : "converted-yaml"}
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
