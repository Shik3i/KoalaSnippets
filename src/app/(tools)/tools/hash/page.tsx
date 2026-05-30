"use client";

import { Hash } from "lucide-react";
import { HashTool } from "@/features/tools/components";

export default function HashGeneratorPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Hash size={20} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold">Hash Generator</h1>
        </div>
        <HashTool />
      </div>
    </div>
  );
}
