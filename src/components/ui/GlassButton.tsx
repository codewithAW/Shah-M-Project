import * as React from 'react';
import { cn } from '../../lib/utils';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          // Variants
          {
            'glass-panel text-foreground hover:bg-secondary': variant === 'default',
            'bg-primary text-primary-foreground border border-primary/80 shadow-sm hover:bg-primary/90 hover:shadow-md': variant === 'primary',
            'bg-secondary text-secondary-foreground border border-border hover:bg-muted': variant === 'secondary',
            'bg-error text-white border border-error/80 shadow-sm hover:bg-error/90': variant === 'danger',
            'bg-success text-white border border-success/80 shadow-sm hover:bg-success/90': variant === 'success',
            'text-foreground hover:bg-secondary border border-transparent': variant === 'ghost',
          },
          // Sizes
          {
            'h-8 px-3 text-xs rounded-lg': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = 'GlassButton';
