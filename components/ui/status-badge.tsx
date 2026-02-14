import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  tone: "success" | "warning" | "danger" | "neutral";
  label: string;
  className?: string;
}

export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-pill", className)} data-state={tone}>
      {label}
    </span>
  );
}
