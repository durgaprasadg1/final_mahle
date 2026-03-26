import * as React from "react";
import { X } from "lucide-react"; // X icon import kar rahe hain close button ke liye
import { cn } from "@/lib/utils"; // Class names merge karne ke liye utility function

// Dialog component - Yeh modal ka main wrapper hai
const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null; // Agar open nahi hai, kuch render mat karo

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto"> // Full screen overlay
      <div
        className="fixed inset-0 bg-black/50" // Dark background blur
        onClick={() => onOpenChange(false)} // Click karne se modal close ho jata hai
      />
      <div className="flex min-h-full items-center justify-center p-4"> // Center alignment
        <div className="relative z-50">{children}</div> // Modal content yahan aata hai
      </div>
    </div>
  );
};

// DialogContent - Yeh modal ka content box hai
const DialogContent = React.forwardRef(
  ({ className, children, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-lg shadow-lg p-6 relative animate-fadeIn max-w-2xl w-full mx-4", // White background, rounded, shadow, padding
        className, // Custom classes add karne ke liye
      )}
      {...props}
    >
      {onClose && ( // Agar onClose prop diya hai, toh close button dikhao
        <button
          onClick={onClose} // Click karne se modal close hota hai
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" /> 
          <span className="sr-only">Close</span> 
        </button>
      )}
      {children} 
    </div>
  ),
);
DialogContent.displayName = "DialogContent"; // DevTools me readable naam

// DialogHeader - Modal ka header section
const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4", // Flex column, spacing, alignment
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

// DialogTitle - Modal ka title
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight", 
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

// DialogDescription - Modal ka description text
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)} // Chota, muted text
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

// Export kar rahe hain sab components
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
