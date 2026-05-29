"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  showMinimap?: boolean;
}

export const CodeEditor = React.forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  ({ value, onChange, onKeyDown, className, showMinimap, ...props }, forwardedRef) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Sync unified ref handler to support both callback refs and ref objects from parents
    const setRef = React.useCallback(
      (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element;
        if (!forwardedRef) return;
        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else {
          (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
        }
      },
      [forwardedRef]
    );
    
    // We use a ref to track the desired cursor position after a programmatic mutation
    const cursorPositionRef = React.useRef<{ start: number; end: number } | null>(null);

    // Debounce state for large pastes/typing to prevent UI freezing
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Sync external value changes to local state if they differ
    React.useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const triggerChange = (newVal: string, start?: number, end?: number) => {
      setLocalValue(newVal);
      
      if (start !== undefined && end !== undefined) {
        cursorPositionRef.current = { start, end };
        // Use setTimeout(0) to restore cursor after React flushes the DOM update
        setTimeout(() => {
          if (cursorPositionRef.current && textareaRef.current) {
            const { start, end } = cursorPositionRef.current;
            textareaRef.current.selectionStart = start;
            textareaRef.current.selectionEnd = end;
            cursorPositionRef.current = null;
          }
        }, 0);
      }
      
      // Debounce the heavy parent onChange to prevent UI freezing on large pastes
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(newVal);
      }, 150);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const val = localValue;

      // Handle Ctrl+S / Cmd+S save race-condition by immediately flushing the timeout
      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (modifier && e.key.toLowerCase() === "s") {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          onChange(val);
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const tabChar = "  "; // 2 spaces
        const newVal = val.substring(0, selectionStart) + tabChar + val.substring(selectionEnd);
        triggerChange(newVal, selectionStart + tabChar.length, selectionStart + tabChar.length);
      } else if (e.key === "Backspace") {
        if (selectionStart === selectionEnd && selectionStart > 0) {
          const prevChar = val.charAt(selectionStart - 1);
          const nextChar = val.charAt(selectionStart);
          const isPair = (
            (prevChar === "{" && nextChar === "}") ||
            (prevChar === "[" && nextChar === "]") ||
            (prevChar === "(" && nextChar === ")") ||
            (prevChar === '"' && nextChar === '"') ||
            (prevChar === "'" && nextChar === "'") ||
            (prevChar === "`" && nextChar === "`")
          );
          if (isPair) {
            e.preventDefault();
            const newVal = val.substring(0, selectionStart - 1) + val.substring(selectionStart + 1);
            triggerChange(newVal, selectionStart - 1, selectionStart - 1);
          }
        }
      } else {
        const pairs: Record<string, string> = {
          "{": "}",
          "[": "]",
          "(": ")",
          '"': '"',
          "'": "'",
          "`": "`",
        };

        if (pairs[e.key] !== undefined) {
          const char = e.key;
          const closingChar = pairs[char];

          // If overtyping identical quote
          if ((char === '"' || char === "'" || char === "`") && val.charAt(selectionStart) === char) {
            e.preventDefault();
            textarea.selectionStart = selectionStart + 1;
            textarea.selectionEnd = selectionStart + 1;
            return;
          }

          e.preventDefault();
          const newVal = val.substring(0, selectionStart) + char + closingChar + val.substring(selectionEnd);
          triggerChange(newVal, selectionStart + 1, selectionStart + 1);
        } else if (e.key === "}" || e.key === "]" || e.key === ")") {
          // If overtyping closing bracket
          if (val.charAt(selectionStart) === e.key) {
            e.preventDefault();
            textarea.selectionStart = selectionStart + 1;
            textarea.selectionEnd = selectionStart + 1;
            return;
          }
        }
      }

      // Propagate original onKeyDown if exists
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      triggerChange(e.target.value);
    };

    return (
      <div className="relative w-full h-full">
        <Textarea
          ref={setRef}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={className}
          {...props}
        />
        {showMinimap && (
          <div className="absolute top-0 right-4 w-20 h-full overflow-hidden pointer-events-none opacity-40 bg-muted/10 border-l border-border select-none hide-scrollbar mask-image-bottom">
            <pre className="text-[2px] leading-[3px] font-mono text-muted-foreground p-2 whitespace-pre overflow-hidden">
              {localValue}
            </pre>
          </div>
        )}
      </div>
    );
  }
);

CodeEditor.displayName = "CodeEditor";
