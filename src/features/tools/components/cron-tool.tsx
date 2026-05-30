"use client";

import { useState, useMemo } from "react";
import { Clock, Play, HelpCircle, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

interface CronSchedule {
  minutes: number[];
  hours: number[];
  doms: number[];
  months: number[];
  dows: number[];
}

// Parse a single cron field into readable text or a list of allowed values
function parseField(field: string, type: "minute" | "hour" | "dom" | "month" | "dow"): { text: string; values: number[] } {
  const minMap = { minute: 0, hour: 0, dom: 1, month: 1, dow: 0 };
  const maxMap = { minute: 59, hour: 23, dom: 31, month: 12, dow: 6 };
  const min = minMap[type];
  const max = maxMap[type];

  const dowNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatVal = (val: number): string => {
    if (type === "dow") return dowNames[val] || String(val);
    if (type === "month") return monthNames[val] || String(val);
    return String(val);
  };

  const getValuesInRange = (start: number, end: number): number[] => {
    const list: number[] = [];
    for (let i = start; i <= end; i++) list.push(i);
    return list;
  };

  // Case 1: Wildcard *
  if (field === "*") {
    return {
      text: `every ${type}`,
      values: getValuesInRange(min, max),
    };
  }

  // Case 2: Step values */X or X/Y
  const stepMatch = field.match(/^(\*|\d+)\/(\d+)$/);
  if (stepMatch) {
    const start = stepMatch[1] === "*" ? min : parseInt(stepMatch[1], 10);
    const step = parseInt(stepMatch[2], 10);
    if (start < min || start > max || step <= 0 || step > max) {
      return { text: "", values: [] };
    }
    const values: number[] = [];
    for (let i = start; i <= max; i += step) {
      values.push(i);
    }
    return {
      text: `every ${step} ${type}s starting from ${formatVal(start)}`,
      values,
    };
  }

  // Case 3: List of ranges/numbers separated by comma
  const parts = field.split(",");
  const values: number[] = [];
  const descriptions: string[] = [];

  for (const part of parts) {
    // Check range X-Y
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start >= min && end <= max) {
        values.push(...getValuesInRange(start, end));
        descriptions.push(`${formatVal(start)} through ${formatVal(end)}`);
      }
    } else {
      const val = parseInt(part, 10);
      if (!isNaN(val) && val >= min && val <= max) {
        values.push(val);
        descriptions.push(formatVal(val));
      }
    }
  }

  // Deduplicate and sort values
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);

  return {
    text: descriptions.join(", "),
    values: uniqueValues,
  };
}

// Generate the natural language translation of a full cron expression
export function translateCron(cron: string): { translation: string; valid: boolean; schedule?: CronSchedule } {
  const parts = cron.trim().replace(/\s+/g, " ").split(" ");
  if (parts.length !== 5) {
    return { translation: "Cron expression must have exactly 5 fields (minute, hour, day of month, month, day of week)", valid: false };
  }

  try {
    const minParsed = parseField(parts[0], "minute");
    const hourParsed = parseField(parts[1], "hour");
    const domParsed = parseField(parts[2], "dom");
    const monthParsed = parseField(parts[3], "month");
    const dowParsed = parseField(parts[4], "dow");

    if (
      !minParsed.values.length ||
      !hourParsed.values.length ||
      !domParsed.values.length ||
      !monthParsed.values.length ||
      !dowParsed.values.length
    ) {
      return { translation: "Invalid cron values detected", valid: false };
    }

    // Build translation sentence
    let result = "At ";
    
    // Minutes and Hours
    if (parts[0] === "*" && parts[1] === "*") {
      result += "every minute ";
    } else if (parts[0] !== "*" && parts[1] === "*") {
      if (parts[0].includes("/")) {
        result += `${minParsed.text} `;
      } else {
        result += `minute ${minParsed.text} of every hour `;
      }
    } else if (parts[0] === "*" && parts[1] !== "*") {
      result += `every minute of hour ${hourParsed.text} `;
    } else {
      // e.g. "At 14:15"
      const times: string[] = [];
      for (const h of hourParsed.values) {
        for (const m of minParsed.values) {
          times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
      }
      if (times.length <= 6) {
        result += `${times.join(", ")} `;
      } else {
        result += `minute ${minParsed.text} past hour ${hourParsed.text} `;
      }
    }

    // Days of month
    if (parts[2] !== "*") {
      result += `on day ${domParsed.text} `;
    }

    // Months
    if (parts[3] !== "*") {
      result += `in ${monthParsed.text} `;
    }

    // Days of week
    if (parts[4] !== "*") {
      if (parts[2] !== "*") {
        result += `and on ${dowParsed.text}`;
      } else {
        result += `on ${dowParsed.text}`;
      }
    }

    if (parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
      result += "every day";
    }

    return {
      translation: result.replace(/\s+/g, " ").trim() + ".",
      valid: true,
      schedule: {
        minutes: minParsed.values,
        hours: hourParsed.values,
        doms: domParsed.values,
        months: monthParsed.values,
        dows: dowParsed.values,
      },
    };
  } catch (err) {
    return { translation: "Error parsing expression: " + (err as Error).message, valid: false };
  }
}

// Calculate the next N dates from a parsed schedule
function getNextDates(schedule: CronSchedule, count: number = 5): Date[] {
  const dates: Date[] = [];
  const current = new Date();
  
  // Set current to start of next minute
  current.setSeconds(0);
  current.setMilliseconds(0);
  current.setMinutes(current.getMinutes() + 1);

  // Safety break to prevent infinite loops (max 3 years of iterations)
  const maxIterations = 365 * 24 * 60 * 3;
  let iter = 0;

  while (dates.length < count && iter < maxIterations) {
    iter++;
    const minute = current.getMinutes();
    const hour = current.getHours();
    const dom = current.getDate();
    const month = current.getMonth() + 1; // 1-indexed
    const dow = current.getDay(); // 0 is Sunday, matches cron format

    if (
      schedule.minutes.includes(minute) &&
      schedule.hours.includes(hour) &&
      schedule.doms.includes(dom) &&
      schedule.months.includes(month) &&
      schedule.dows.includes(dow)
    ) {
      dates.push(new Date(current));
    }

    // Move forward 1 minute
    current.setMinutes(current.getMinutes() + 1);
  }

  return dates;
}

export function CronTool() {
  const [activeTab, setActiveTab] = useState<"explain" | "build">("explain");
  const [cronInput, setCronInput] = useLocalStorageState<string>("koalatools_cron_expression", "*/5 * * * *");
  const [copied, setCopied] = useState(false);

  // Builder States
  const [builderType, setBuilderType] = useState<"minutes" | "hourly" | "daily" | "weekly">("minutes");
  const [buildMinutes, setBuildMinutes] = useState(5);
  const [buildHourMinute, setBuildHourMinute] = useState(0);
  const [buildDailyHour, setBuildDailyHour] = useState(12);
  const [buildDailyMinute, setBuildDailyMinute] = useState(0);
  const [buildWeeklyDays, setBuildWeeklyDays] = useState<number[]>([1]); // Monday by default
  const [buildWeeklyHour, setBuildWeeklyHour] = useState(12);
  const [buildWeeklyMinute, setBuildWeeklyMinute] = useState(0);

  const parsed = useMemo(() => translateCron(cronInput), [cronInput]);

  const nextDates = useMemo(() => {
    if (!parsed.valid || !parsed.schedule) return [];
    return getNextDates(parsed.schedule, 5);
  }, [parsed]);

  // Synchronize builder adjustments to generated cron expression
  const applyBuild = () => {
    let expr = "* * * * *";
    if (builderType === "minutes") {
      expr = `*/${buildMinutes} * * * *`;
    } else if (builderType === "hourly") {
      expr = `${buildHourMinute} * * * *`;
    } else if (builderType === "daily") {
      expr = `${buildDailyMinute} ${buildDailyHour} * * *`;
    } else if (builderType === "weekly") {
      const days = buildWeeklyDays.length ? buildWeeklyDays.sort((a, b) => a - b).join(",") : "*";
      expr = `${buildWeeklyMinute} ${buildWeeklyHour} * * ${days}`;
    }
    setCronInput(expr);
    setActiveTab("explain");
  };

  const toggleWeeklyDay = (day: number) => {
    setBuildWeeklyDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      return [...prev, day];
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cronInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={activeTab === "explain" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("explain")}>
          Explain & Test
        </Button>
        <Button variant={activeTab === "build" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("build")}>
          Visual Cron Builder
        </Button>
      </div>

      {activeTab === "explain" ? (
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Cron Expression</label>
              <input
                value={cronInput}
                onChange={(e) => setCronInput(e.target.value)}
                placeholder="*/5 * * * *"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy} className="h-[46px] w-[46px]" aria-label="Copy code">
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </Button>
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <HelpCircle size={14} className="text-primary" />
              Human-Readable Translation
            </h3>
            <p className={`text-base font-semibold leading-relaxed ${parsed.valid ? "text-foreground" : "text-rose-400"}`}>
              {parsed.translation}
            </p>
          </div>

          {parsed.valid && nextDates.length > 0 && (
            <div className="p-4 border border-border rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Clock size={14} className="text-emerald-400" />
                Next 5 Execution Cycles
              </h3>
              <div className="divide-y divide-border/40 font-mono text-xs">
                {nextDates.map((date, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center first:pt-0 last:pb-0">
                    <span className="text-muted-foreground font-medium">Cycle {idx + 1}:</span>
                    <span className="text-foreground font-semibold">{date.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 border border-border p-5 rounded-xl bg-muted/20 animate-in fade-in duration-200">
          <div className="flex gap-2 flex-wrap mb-4">
            {(["minutes", "hourly", "daily", "weekly"] as const).map((type) => (
              <Button
                key={type}
                variant={builderType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setBuilderType(type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {builderType === "minutes" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">Run every</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min={1}
                    max={59}
                    value={buildMinutes}
                    onChange={(e) => setBuildMinutes(parseInt(e.target.value))}
                    className="w-48 accent-primary"
                  />
                  <span className="font-mono text-sm font-semibold">{buildMinutes} minute(s)</span>
                </div>
              </div>
            )}

            {builderType === "hourly" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">Run every hour at minute</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min={0}
                    max={59}
                    value={buildHourMinute}
                    onChange={(e) => setBuildHourMinute(parseInt(e.target.value))}
                    className="w-48 accent-primary"
                  />
                  <span className="font-mono text-sm font-semibold">Minute: {buildHourMinute}</span>
                </div>
              </div>
            )}

            {builderType === "daily" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Hour (0-23)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={buildDailyHour}
                    onChange={(e) => setBuildDailyHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Minute (0-59)</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={buildDailyMinute}
                    onChange={(e) => setBuildDailyMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}

            {builderType === "weekly" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">On specific days</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                      <Button
                        key={day}
                        variant={buildWeeklyDays.includes(idx) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWeeklyDay(idx)}
                        className="w-12"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Hour (0-23)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={buildWeeklyHour}
                      onChange={(e) => setBuildWeeklyHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Minute (0-59)</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={buildWeeklyMinute}
                      onChange={(e) => setBuildWeeklyMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={applyBuild} className="w-full mt-4 gap-1.5">
              <Play size={14} /> Generate & Review Cron
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
