import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "text-sm font-semibold leading-none select-none",
    "transition-[background-color,border-color,color,box-shadow,transform,opacity]",
    "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.985] active:transition-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary/92 hover:shadow-[var(--shadow-md)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:bg-destructive/92 hover:shadow-[var(--shadow-md)]",
        outline:
          "border border-[hsl(var(--hairline-strong))] bg-transparent text-foreground hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--hairline-strong))]",
        secondary:
          "bg-[hsl(var(--surface-3))] text-secondary-foreground hover:bg-[hsl(var(--surface-3))]/80",
        soft: "bg-primary/10 text-primary hover:bg-primary/16",
        ghost:
          "text-foreground/80 hover:bg-[hsl(var(--surface-2))] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
        cinema:
          "cinema-gradient text-primary-foreground btn-professional shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.6)] hover:shadow-[0_10px_28px_-8px_hsl(var(--primary)/0.7)]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-lg px-3 text-[0.8125rem]",
        lg: "h-11 rounded-xl px-6",
        xl: "h-[3.25rem] rounded-2xl px-8 text-base [&_svg]:size-5",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
