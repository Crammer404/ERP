interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className = '' }: SectionWrapperProps) {
  return (
    <div className="container mx-auto px-16">
      <div className={`max-w-7xl mx-auto ${className}`}>
        {children}
      </div>
    </div>
  );
}
