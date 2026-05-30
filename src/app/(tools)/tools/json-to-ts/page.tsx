"use client";

import { Braces } from "lucide-react";
import { JsonToTsTool } from "@/features/tools/components";

export default function JsonToTsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Braces size={20} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold">JSON to TS / Zod Schema Generator</h1>
        </div>
        <JsonToTsTool />
      </div>
    </div>
  );
}
