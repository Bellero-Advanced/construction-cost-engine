import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "green" | "red" | "amber" | "line" | "teal";

const styles: Record<Variant, string> = {
  green: "bg-green text-paper",
  red: "bg-red text-paper",
  amber: "bg-amber text-ink",
  line: "border border-ink text-ink",
  teal: "bg-teal text-paper",
};

export function Badge({
  variant = "line",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.1em]",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
