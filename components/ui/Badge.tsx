import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full bg-[var(--primary-muted)] px-3 py-1 text-xs font-medium text-[var(--primary-contrast)]",
      className
    )}
    {...props}
  />
);
