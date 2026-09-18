import * as React from 'react';
import { cn } from '../../lib/utils';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export function GlassBadge({ className, variant = 'default', children, ...props }: GlassBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap',
        {
          'bg-secondary text-secondary-foreground border border-border': variant === 'default',
          'bg-primary/10 text-primary border border-primary/20': variant === 'primary',
          'bg-success/10 text-success border border-success/20': variant === 'success',
          'bg-warning/10 text-warning border border-warning/20': variant === 'warning',
          'bg-error/10 text-error border border-error/20': variant === 'error',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
