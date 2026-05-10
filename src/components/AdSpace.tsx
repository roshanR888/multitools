import React from 'react';
import { cn } from '../lib/utils';

interface AdSpaceProps {
  className?: string;
  type?: 'banner' | 'sidebar' | 'content' | 'footer';
  label?: string;
}

export default function AdSpace({ className, type = 'content', label = 'Advertisement' }: AdSpaceProps) {
  const typeStyles = {
    banner: 'h-[90px] w-full max-w-[728px] mx-auto',
    sidebar: 'h-[600px] w-full max-w-[300px] mx-auto',
    content: 'h-[250px] w-full max-w-[300px] mx-auto',
    footer: 'h-[90px] w-full max-w-[970px] mx-auto',
  };

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 flex items-center justify-center transition-all hover:border-indigo-500/20",
      typeStyles[type],
      className
    )}>
      {/* Background Decorative Element */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="flex flex-col items-center gap-2 text-stone-400 dark:text-stone-600">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        <div className="w-8 h-8 rounded-full border-2 border-current border-dashed animate-[spin_10s_linear_infinite]" />
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-12" />
    </div>
  );
}
