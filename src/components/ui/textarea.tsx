import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-1))] px-3.5 py-2.5 text-base md:text-sm leading-relaxed",
        "text-foreground placeholder:text-muted-foreground",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:bg-[hsl(var(--surface-2))]",
        "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-[hsl(var(--surface-1))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))]/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
