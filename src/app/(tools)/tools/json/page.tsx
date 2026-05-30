"use client";

import { Braces } from "lucide-react";
import { JsonTool } from "@/features/tools/components";

export default function JsonFormatterPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Braces size={20} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold">JSON Formatter</h1>
        </div>
        <JsonTool />
      </div>
    </div>
  );
}
