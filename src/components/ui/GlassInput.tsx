import * as React from 'react';
import { cn } from '../../lib/utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)', pointerEvents: 'none', display: 'flex', alignItems: 'center', zIndex: 2 }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn('form-input', className)}
          ref={ref}
          {...props}
          style={{ paddingLeft: icon ? '2.75rem' : undefined, ...props.style }}
        />
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';
