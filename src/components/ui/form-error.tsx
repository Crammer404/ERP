import * as React from "react";
import { cn } from "@/lib/utils";

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, message, children, ...props }, ref) => {
    const content = message || children;
    
    if (!content) return null;

    return (
      <p
        ref={ref}
        className={cn(
          "text-[11px] font-medium text-destructive",
          className
        )}
        {...props}
      >
        {content}
      </p>
    );
  }
);

FormError.displayName = "FormError";

export { FormError };
