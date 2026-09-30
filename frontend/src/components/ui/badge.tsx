import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'bot'
    | 'pending'
    | 'human'
    | 'closed'
    | 'bug'
    | 'question'
    | 'reclamation';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border';

  const variants = {
    default:
      'border-transparent bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    secondary:
      'border-[var(--border-subtle)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
    outline:
      'text-[var(--text-primary)] border-[var(--border-strong)]',
    // Statuses
    bot: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-[11px]',
    pending:
      'border-amber-500/40 bg-amber-500/15 text-amber-400 font-mono text-[11px] animate-pulse',
    human:
      'border-emerald-500/30 bg-emerald-500/15 text-emerald-400 font-mono text-[11px]',
    closed:
      'border-slate-500/30 bg-slate-500/10 text-slate-400 font-mono text-[11px]',
    // Categories
    bug: 'border-red-500/30 bg-red-500/10 text-red-400 font-medium',
    question:
      'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-medium',
    reclamation:
      'border-orange-500/30 bg-orange-500/10 text-orange-400 font-medium',
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  );
}

export { Badge };
