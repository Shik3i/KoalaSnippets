import { cn } from "@/features/core/utils/utils";
import { Check, Minus } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  "aria-label"?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  id?: string;
  name?: string;
}

export function Checkbox({ checked, onChange, indeterminate, "aria-label": ariaLabel, className, onClick, id, name }: CheckboxProps) {
  return (
    <label
      className={cn("relative inline-flex items-center justify-center cursor-pointer select-none", className)}
      aria-label={ariaLabel}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={ariaLabel}
        onClick={onClick}
      />
      <span
        className={cn(
          "flex items-center justify-center w-4 h-4 rounded border transition-all duration-200",
          checked || indeterminate
            ? "bg-primary border-primary shadow-sm shadow-primary/20"
            : "border-muted-foreground/40 bg-background hover:border-muted-foreground hover:bg-muted/50"
        )}
      >
        {checked && !indeterminate && <Check size={11} strokeWidth={3} className="text-primary-foreground" />}
        {indeterminate && <Minus size={11} strokeWidth={3} className="text-primary-foreground" />}
      </span>
    </label>
  );
}
