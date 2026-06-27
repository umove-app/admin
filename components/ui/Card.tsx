import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)} {...props} />
);
