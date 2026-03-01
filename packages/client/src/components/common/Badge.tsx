import type { ReactNode } from 'react';

type BadgeColor = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'water' | 'energy';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  blue: 'bg-nexus-600/20 text-nexus-400',
  green: 'bg-green-600/20 text-green-400',
  yellow: 'bg-yellow-600/20 text-yellow-400',
  red: 'bg-red-600/20 text-red-400',
  gray: 'bg-gray-700/50 text-gray-400',
  water: 'bg-water-600/20 text-water-400',
  energy: 'bg-energy-600/20 text-energy-400',
};

export function Badge({ children, color = 'blue', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
