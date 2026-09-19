import * as React from 'react';
import { cn } from '../../lib/utils';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger';
}

export function GlassBadge({ className, variant = 'default', children, ...props }: GlassBadgeProps) {
  // Map 'error' to 'danger' for CSS class
  const badgeVariant = variant === 'error' ? 'danger' : variant;
  
  return (
    <div
      className={cn(
        'badge',
        `badge-${badgeVariant}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
