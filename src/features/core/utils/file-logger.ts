import "server-only";
import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), process.env.BACKUP_DIR || "./backups");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");
const MAX_LOG_SIZE = 5 * 1024 * 1024;
const MAX_LOG_FILES = 3;

let pendingWrites: string[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let ensureDirDone = false;

function ensureLogDir() {
  if (ensureDirDone) return;
  ensureDirDone = true;
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    // cannot create log dir - file logging disabled
  }
}

function flushLogs() {
  if (pendingWrites.length === 0) return;
  const lines = pendingWrites;
  pendingWrites = [];
  flushTimeout = null;

  try {
    ensureLogDir();
    const content = lines.join("\n") + "\n";

    if (fs.existsSync(ERROR_LOG_FILE) && fs.statSync(ERROR_LOG_FILE).size + Buffer.byteLength(content) > MAX_LOG_SIZE) {
      for (let i = MAX_LOG_FILES - 1; i >= 0; i--) {
        const oldName = i === 0 ? ERROR_LOG_FILE : `${ERROR_LOG_FILE}.${i}`;
        const newName = `${ERROR_LOG_FILE}.${i + 1}`;
        if (fs.existsSync(oldName)) {
          if (i === MAX_LOG_FILES - 1) {
            fs.unlinkSync(oldName);
          } else {
            fs.renameSync(oldName, newName);
          }
        }
      }
    }

    fs.appendFileSync(ERROR_LOG_FILE, content);
  } catch {
    // file logging failed - fall back to console only
  }
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(flushLogs, 1000);
}

export function logToFile(level: string, message: string, extra?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const extraStr = extra ? ` ${JSON.stringify(extra)}` : "";
  const line = `[${timestamp}] [${level}] ${message}${extraStr}`;

  pendingWrites.push(line);
  scheduleFlush();
}

export function logErrorToFile(error: unknown, context?: string, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const prefix = context ? `[${context}] ` : "";

  logToFile("ERROR", `${prefix}${message}`, { ...extra, stack: stack?.split("\n").slice(0, 5) });

  if (stack) {
    console.error(`[file-logger] ${prefix}${message}\n${stack.split("\n").slice(0, 5).join("\n")}`);
  } else {
    console.error(`[file-logger] ${prefix}${message}`);
  }
}

function handleExit() {
  flushLogs();
}

if (typeof process !== "undefined") {
  process.on("exit", handleExit);
  process.on("SIGINT", () => { flushLogs(); process.exit(); });
  process.on("SIGTERM", () => { flushLogs(); process.exit(); });
}
