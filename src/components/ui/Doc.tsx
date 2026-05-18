import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  tag?: string;
  children: ReactNode;
  className?: string;
}

export function Doc({ tag, children, className }: Props) {
  return (
    <div className={cn("doc mb-6", className)}>
      {tag && <span className="doc-tag">{tag}</span>}
      {children}
    </div>
  );
}
