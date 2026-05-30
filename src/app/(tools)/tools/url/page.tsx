"use client";

import { Link2 } from "lucide-react";
import { UrlTool } from "@/features/tools/components";

export default function UrlEncoderDecoderPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Link2 size={20} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold">URL Encoder / Decoder</h1>
        </div>
        <UrlTool />
      </div>
    </div>
  );
}
