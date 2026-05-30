"use client";

import { Regex } from "lucide-react";
import { RegexTool } from "@/features/tools/components";

export default function RegexTesterPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Regex size={20} className="text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold">Regex Tester</h1>
        </div>
        <RegexTool />
      </div>
    </div>
  );
}
