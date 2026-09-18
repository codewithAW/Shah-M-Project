import * as React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        {
          'glass-panel': variant === 'default' || variant === 'interactive',
          'glass-elevated': variant === 'elevated',
        },
        variant === 'interactive' && 'hover:shadow-glass-lg hover:border-primary/20 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
