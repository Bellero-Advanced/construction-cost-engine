import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

const fieldBase =
  "w-full px-3 py-2.5 bg-paper border-[1.5px] border-ink font-sans text-sm transition-all duration-150";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <label className="field-label mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={cn("input", fieldBase, props.className)} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("select", fieldBase, props.className)} />
  );
}
