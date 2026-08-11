import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-1))] px-3.5 py-2 text-base md:text-sm",
          "text-foreground placeholder:text-muted-foreground",
          "transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-2))]",
          "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-[hsl(var(--surface-1))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))]/25",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/25",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
