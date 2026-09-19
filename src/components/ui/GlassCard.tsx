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
        'glass-card glass-card-body',
        {
          'is-elevated': variant === 'elevated',
          'is-interactive': variant === 'interactive',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
