import Link from 'next/link';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  isDashboard?: boolean;
};

export function Logo({ className, isDashboard = false }: LogoProps) {
  return (
    <Link
      href={isDashboard ? '/dashboard' : '/'}
      className={cn(
        'flex items-center gap-2 text-lg font-bold tracking-tight',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-lg p-1.5',
          isDashboard ? 'bg-sidebar-primary' : 'bg-primary'
        )}
      >
        <HeartPulse
          className={cn(
            'h-5 w-5',
            isDashboard ? 'text-sidebar-primary-foreground' : 'text-primary-foreground'
          )}
        />
      </div>
      <span className="font-headline text-black dark:text-white">MedConnect</span>
    </Link>
  );
}
