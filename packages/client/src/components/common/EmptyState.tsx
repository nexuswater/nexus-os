import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-gray-700 mb-3">{icon}</div>}
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {description && <p className="text-xs text-gray-600 mt-1 max-w-xs">{description}</p>}
      {actionLabel && (actionTo ? (
        <Link to={actionTo} className="mt-4 px-4 py-2 text-xs font-medium bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button onClick={onAction} className="mt-4 px-4 py-2 text-xs font-medium bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
          {actionLabel}
        </button>
      ) : null)}
    </div>
  );
}
