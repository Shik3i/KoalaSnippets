"use client";

import { FileKey } from "lucide-react";
import { JwtTool } from "@/features/tools/components";

export default function JwtDecoderPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <FileKey size={20} className="text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold">JWT Decoder</h1>
        </div>
        <JwtTool />
      </div>
    </div>
  );
}
