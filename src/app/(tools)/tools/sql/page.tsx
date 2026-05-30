"use client";

import { Database } from "lucide-react";
import { SqlFormatterTool } from "@/features/tools/components";

export default function SqlFormatterPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Database size={20} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">SQL query Formatter</h1>
        </div>
        <SqlFormatterTool />
      </div>
    </div>
  );
}
