import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: string;
  icon?: ReactNode;
  footer?: ReactNode;
}

export function Card({ children, className = '', header, icon, footer }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {header && (
        <div className="card-header flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-800/60">
          {footer}
        </div>
      )}
    </div>
  );
}
