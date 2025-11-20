export const LoadingSpinner = ({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) => {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]} ${className}`} />
  );
};

export const LoadingFallback = ({ minHeight = "150px", size = "md" }: { minHeight?: string; size?: "sm" | "md" | "lg" }) => (
  <div className="flex items-center justify-center" style={{ minHeight }}>
    <LoadingSpinner size={size} />
  </div>
);
