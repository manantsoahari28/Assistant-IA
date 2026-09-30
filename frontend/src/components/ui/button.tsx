import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] cursor-pointer select-none';

    const variants = {
      default:
        'bg-indigo-600 text-white shadow hover:bg-indigo-500 border border-indigo-500/20',
      destructive:
        'bg-red-600 text-white shadow-sm hover:bg-red-500 border border-red-500/20',
      outline:
        'border border-[var(--border-strong)] bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-primary)]',
      secondary:
        'bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--surface-active)] border border-[var(--border-subtle)]',
      ghost:
        'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]',
      link: 'text-indigo-400 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
