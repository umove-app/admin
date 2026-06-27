import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]",
      className
    )}
    {...props}
  />
);
