"use client";

import { useState, useRef, useMemo } from "react";
import { Copy, Check, Upload, Image as ImageIcon, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

export function ImageConverterTool() {
  const [activeTab, setActiveTab] = useState<"encode" | "decode">("encode");
  
  // Encode state
  const [dragActive, setDragActive] = useState(false);
  const [imgDataUri, setImgDataUri] = useLocalStorageState<string>("koalatools_img_data_uri", "");
  const [rawBase64, setRawBase64] = useLocalStorageState<string>("koalatools_img_raw_base64", "");
  const [imgMeta, setImgMeta] = useLocalStorageState<{ name: string; type: string; size: number; w: number; h: number } | null>(
    "koalatools_img_meta",
    null
  );
  const [copiedDataUri, setCopiedDataUri] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Decode state
  const [inputBase64, setInputBase64] = useLocalStorageState<string>("koalatools_decode_base64", "");

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImgDataUri(result);
      
      const parts = result.split(",");
      const raw = parts[1] || "";
      setRawBase64(raw);

      // Get dimensions
      const img = new Image();
      img.onload = () => {
        setImgMeta({
          name: file.name,
          type: file.type,
          size: file.size,
          w: img.width,
          h: img.height,
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setImgDataUri("");
    setRawBase64("");
    setImgMeta(null);
  };

  // Safe client-side derived rendering from inputBase64 instead of useEffect state syncing
  const decodeResult = useMemo(() => {
    const val = inputBase64.trim();
    if (!val) return { src: "", meta: null, error: "" };

    try {
      let src = val;
      // If it doesn't have data:image/* Prefix, append it
      if (!val.startsWith("data:image/")) {
        // Guess PNG by default
        src = `data:image/png;base64,${val}`;
      }

      // Check if base64 is valid
      const base64Content = src.split(",")[1] || "";
      if (!base64Content) {
        throw new Error("Missing Base64 payload");
      }
      
      // Attempt decoding verification via atob
      atob(base64Content);

      // Extract size
      const sizeBytes = Math.round((base64Content.length * 3) / 4);
      const mimeType = src.match(/data:([^;]+);/)?.[1] || "image/unknown";

      return {
        src,
        meta: { type: mimeType, size: sizeBytes },
        error: "",
      };
    } catch {
      return {
        src: "",
        meta: null,
        error: "Invalid Base64 or Data URI syntax. Please make sure there are no spaces or invalid characters.",
      };
    }
  }, [inputBase64]);

  const decodedSrc = decodeResult.src;
  const decodeMeta = decodeResult.meta;
  const decodeError = decodeResult.error;

  const downloadDecodedImage = () => {
    if (!decodedSrc) return;
    const a = document.createElement("a");
    a.href = decodedSrc;
    const ext = decodeMeta?.type.split("/")[1] || "png";
    a.download = `decoded-image.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={activeTab === "encode" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("encode")}>
          Image → Base64
        </Button>
        <Button variant={activeTab === "decode" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("decode")}>
          Base64 → Image
        </Button>
      </div>

      {activeTab === "encode" ? (
        <div className="space-y-4">
          {!imgDataUri ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`w-full min-h-60 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Drag & drop image here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPEG, WEBP, GIF, SVG</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="md:col-span-1 p-4 bg-muted/30 border border-border rounded-xl flex flex-col items-center justify-center">
                <div className="relative w-full aspect-square bg-checkered rounded-lg overflow-hidden border border-border/50 flex items-center justify-center p-2 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgDataUri} alt="Preview" className="max-w-full max-h-full object-contain rounded-md shadow-md" />
                </div>
                {imgMeta && (
                  <div className="w-full text-xs space-y-1.5 font-medium text-muted-foreground border-t border-border/50 pt-3">
                    <div className="flex justify-between"><span className="text-muted-foreground/75">Filename:</span><span className="text-foreground max-w-[150px] truncate">{imgMeta.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground/75">Format:</span><span className="text-foreground">{imgMeta.type}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground/75">Dimensions:</span><span className="text-foreground">{imgMeta.w} × {imgMeta.h}px</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground/75">File Size:</span><span className="text-foreground">{formatSize(imgMeta.size)}</span></div>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={clearImage} className="w-full mt-4 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                  Clear Image
                </Button>
              </div>

              <div className="md:col-span-2 space-y-3 flex flex-col">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-muted-foreground">Data URI Code</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={async () => {
                        await navigator.clipboard.writeText(imgDataUri);
                        setCopiedDataUri(true);
                        setTimeout(() => setCopiedDataUri(false), 2000);
                      }}
                    >
                      {copiedDataUri ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedDataUri ? "Copied" : "Copy Data URI"}
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={imgDataUri}
                    className="flex-1 min-h-[100px] w-full p-3 bg-muted/50 border border-border rounded-lg font-mono text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-normal overflow-y-auto"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-muted-foreground">Raw Base64</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={async () => {
                        await navigator.clipboard.writeText(rawBase64);
                        setCopiedRaw(true);
                        setTimeout(() => setCopiedRaw(false), 2000);
                      }}
                    >
                      {copiedRaw ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedRaw ? "Copied" : "Copy Base64"}
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={rawBase64}
                    className="flex-1 min-h-[100px] w-full p-3 bg-muted/50 border border-border rounded-lg font-mono text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-normal overflow-y-auto"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          <p className="text-sm text-muted-foreground">Paste a Base64 string or Data URI to preview and download the image.</p>
          <textarea
            value={inputBase64}
            onChange={(e) => setInputBase64(e.target.value)}
            placeholder="data:image/png;base64,iVBORw0KGgoAAA..."
            className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {decodeError ? (
            <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400 flex gap-2 items-start">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{decodeError}</span>
            </div>
          ) : decodedSrc ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border border-border p-4 rounded-xl bg-muted/30">
              <div className="md:col-span-1 bg-checkered aspect-square border border-border rounded-lg overflow-hidden flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={decodedSrc} alt="Decoded Preview" className="max-w-full max-h-full object-contain rounded-md shadow-md" />
              </div>
              <div className="md:col-span-2 space-y-3">
                <h3 className="font-bold flex items-center gap-1.5 text-sm">
                  <ImageIcon size={16} className="text-primary" />
                  Successfully Decoded Image
                </h3>
                {decodeMeta && (
                  <div className="text-xs space-y-1 font-medium text-muted-foreground">
                    <div>Format: <span className="text-foreground">{decodeMeta.type}</span></div>
                    <div>Guessed File Size: <span className="text-foreground">{formatSize(decodeMeta.size)}</span></div>
                  </div>
                )}
                <Button onClick={downloadDecodedImage} className="gap-2">
                  <Download size={14} /> Download Decoded Image
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
