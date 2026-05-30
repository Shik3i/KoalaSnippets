"use client";

import { Clock } from "lucide-react";
import { CronTool } from "@/features/tools/components";

export default function CronToolPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock size={20} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold">Cron Expression Tool</h1>
        </div>
        <CronTool />
      </div>
    </div>
  );
}
