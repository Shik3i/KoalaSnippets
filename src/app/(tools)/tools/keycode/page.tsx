"use client";

import { Keyboard } from "lucide-react";
import { KeycodeTool } from "@/features/tools/components";

export default function KeycodePage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Keyboard size={20} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Keyboard Event Inspector</h1>
        </div>
        <KeycodeTool />
      </div>
    </div>
  );
}
