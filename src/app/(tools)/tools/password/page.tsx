"use client";

import { Key } from "lucide-react";
import { PasswordTool } from "@/features/tools/components";

export default function PasswordGeneratorPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Key size={20} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Password Generator</h1>
        </div>
        <PasswordTool />
      </div>
    </div>
  );
}
