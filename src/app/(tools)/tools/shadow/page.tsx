"use client";

import { Sliders } from "lucide-react";
import { ShadowGeneratorTool } from "@/features/tools/components";

export default function ShadowGeneratorPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Sliders size={20} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">CSS Shadow Generator</h1>
        </div>
        <ShadowGeneratorTool />
      </div>
    </div>
  );
}
