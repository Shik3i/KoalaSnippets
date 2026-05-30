"use client";

import { Diff } from "lucide-react";
import { DiffTool } from "@/features/tools/components";

export default function DiffCheckerPage() {
  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Diff size={20} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Text Diff Checker</h1>
        </div>
        <DiffTool />
      </div>
    </div>
  );
}
