import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "dark" | "success" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-amber text-ink",
  secondary: "bg-paper text-ink",
  dark: "bg-ink text-paper",
  success: "bg-green text-paper",
  danger: "bg-red text-paper",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 border-[1.5px] border-ink font-mono font-bold uppercase tracking-[0.1em]",
        "hover:shadow-[3px_3px_0_var(--color-ink)] hover:bg-amber-bright",
        "active:shadow-none",
        size === "sm"
          ? "px-3.5 py-2 text-[11px]"
          : "px-[18px] py-3 text-[13px]",
        variants[variant],
        block && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}
