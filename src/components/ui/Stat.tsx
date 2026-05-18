import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "green" | "red" | "teal" | "amber";
}) {
  const map: Record<string, string> = {
    green: "border-l-green",
    red: "border-l-red",
    teal: "border-l-teal",
    amber: "border-l-amber",
  };
  const text: Record<string, string> = {
    green: "text-green",
    red: "text-red",
    teal: "text-teal",
    amber: "text-amber",
  };
  return (
    <div
      className={cn(
        "relative border-[1.5px] border-l-[5px] border-ink bg-paper px-4 py-3.5",
        map[accent],
      )}
    >
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
        {label}
      </div>
      <div
        className={cn("font-display text-[30px] leading-none", text[accent])}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[10px] text-ink-3">{sub}</div>
      )}
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "border-b-2 border-amber p-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em]",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  mono,
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-dashed border-paper-2 p-3",
        align === "right" && "text-right",
        align === "center" && "text-center",
        mono && "font-mono font-medium",
        className,
      )}
    >
      {children}
    </td>
  );
}
