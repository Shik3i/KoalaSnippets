"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor = React.forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  ({ value, onChange, onKeyDown, className, ...props }, forwardedRef) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;
    
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

    // Restore cursor position immediately after React updates the DOM with new localValue
    React.useLayoutEffect(() => {
      if (cursorPositionRef.current && ref.current) {
        ref.current.selectionStart = cursorPositionRef.current.start;
        ref.current.selectionEnd = cursorPositionRef.current.end;
        cursorPositionRef.current = null;
      }
    }, [localValue, ref]);

    const triggerChange = (newVal: string, start?: number, end?: number) => {
      setLocalValue(newVal);
      
      if (start !== undefined && end !== undefined) {
        cursorPositionRef.current = { start, end };
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
            cursorPositionRef.current = { start: selectionStart + 1, end: selectionStart + 1 };
            setLocalValue((v) => v); // Force re-render to apply cursor
            return;
          }

          e.preventDefault();
          const newVal = val.substring(0, selectionStart) + char + closingChar + val.substring(selectionEnd);
          triggerChange(newVal, selectionStart + 1, selectionStart + 1);
        } else if (e.key === "}" || e.key === "]" || e.key === ")") {
          // If overtyping closing bracket
          if (val.charAt(selectionStart) === e.key) {
            e.preventDefault();
            cursorPositionRef.current = { start: selectionStart + 1, end: selectionStart + 1 };
            setLocalValue((v) => v);
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
      <Textarea
        ref={ref}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    );
  }
);

CodeEditor.displayName = "CodeEditor";
