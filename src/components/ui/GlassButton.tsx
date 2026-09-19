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
          'btn',
          `btn-${variant}`,
          `btn-${size}`,
          className
        )}
        {...props}
      />
    );
  }
);
GlassButton.displayName = 'GlassButton';
