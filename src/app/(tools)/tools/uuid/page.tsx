"use client";

import { Fingerprint } from "lucide-react";
import { UuidTool } from "@/features/tools/components";

export default function UuidGeneratorPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Fingerprint size={20} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold">UUID Generator</h1>
        </div>
        <UuidTool />
      </div>
    </div>
  );
}
