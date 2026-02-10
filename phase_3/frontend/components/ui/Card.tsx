import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 rounded-lg p-6",
      bordered: "bg-slate-900 rounded-lg border border-slate-800 p-6",
      elevated: "bg-slate-900 rounded-lg shadow-lg shadow-black/20 p-6",
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card sub-components for structured content
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 mb-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-none tracking-tight text-slate-50", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-slate-400", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center mt-4 pt-4 border-t border-slate-800", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export default Card;
