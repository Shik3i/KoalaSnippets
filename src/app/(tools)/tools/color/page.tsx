"use client";

import { Palette } from "lucide-react";
import { ColorTool } from "@/features/tools/components";

export default function ColorConverterPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
            <Palette size={20} className="text-fuchsia-400" />
          </div>
          <h1 className="text-2xl font-bold">Color Converter</h1>
        </div>
        <ColorTool />
      </div>
    </div>
  );
}
