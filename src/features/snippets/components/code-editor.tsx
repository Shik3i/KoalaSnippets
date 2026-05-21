"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor = React.forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  ({ value, onChange, onKeyDown, className, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const val = textarea.value;

      if (e.key === "Tab") {
        e.preventDefault();
        const tabChar = "  "; // 2 spaces
        const newVal = val.substring(0, selectionStart) + tabChar + val.substring(selectionEnd);
        onChange(newVal);
        
        // Immediate DOM update to prevent cursor jumping
        textarea.value = newVal;
        textarea.selectionStart = textarea.selectionEnd = selectionStart + tabChar.length;
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
            onChange(newVal);
            textarea.value = newVal;
            textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
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
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
            return;
          }

          e.preventDefault();
          const newVal = val.substring(0, selectionStart) + char + closingChar + val.substring(selectionEnd);
          onChange(newVal);
          textarea.value = newVal;
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        } else if (e.key === "}" || e.key === "]" || e.key === ")") {
          // If overtyping closing bracket
          if (val.charAt(selectionStart) === e.key) {
            e.preventDefault();
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          }
        }
      }

      // Propagate original onKeyDown if exists
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    return (
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
    );
  }
);

CodeEditor.displayName = "CodeEditor";
