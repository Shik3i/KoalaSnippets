"use client";

import { Image as ImageIcon } from "lucide-react";
import { ImageConverterTool } from "@/features/tools/components";

export default function ImageConverterPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <ImageIcon size={20} className="text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold">Base64 Image Converter</h1>
        </div>
        <ImageConverterTool />
      </div>
    </div>
  );
}
