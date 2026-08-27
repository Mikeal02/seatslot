import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("shimmer rounded-xl bg-[hsl(var(--surface-3))]", className)}
      {...props}
    />
  );
}

export { Skeleton };
