'use client';

import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative h-16 w-16">
        <HeartPulse className="absolute h-16 w-16 animate-ping text-primary opacity-50" />
        <HeartPulse className="relative h-16 w-16 text-primary" />
      </div>
      <p className="text-lg font-medium text-muted-foreground">Loading...</p>
    </div>
  );
}
