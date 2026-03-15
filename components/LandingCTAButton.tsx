'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

interface Props {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'primary' | 'outline';
  compactOnMobile?: boolean;
}

export default function LandingCTAButton({ size = 'default', variant = 'primary', compactOnMobile = false }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    default: 'px-7 py-3.5 text-base',
    lg: 'px-10 py-4 text-lg',
  }[size];

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2.5 font-bold rounded-xl transition-all group whitespace-nowrap shrink-0 ${sizeClasses} ${
          variant === 'primary'
            ? 'btn-primary'
            : 'border-2 border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        {compactOnMobile ? (
          <>
            <span className="sm:hidden">Console</span>
            <span className="hidden sm:inline">Open My Console</span>
          </>
        ) : (
          'Open My Console'
        )}
        <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${compactOnMobile ? 'hidden sm:inline' : ''}`} />
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={`inline-flex items-center gap-2.5 font-bold rounded-xl transition-all group whitespace-nowrap shrink-0 ${sizeClasses} ${
        variant === 'primary'
          ? 'btn-primary'
          : 'border-2 border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]'
      }`}
    >
      {compactOnMobile ? (
        <>
          <span className="sm:hidden">Join</span>
          <span className="hidden sm:inline">Get Started — It&apos;s Free</span>
        </>
      ) : (
        'Get Started — It\'s Free'
      )}
      <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${compactOnMobile ? 'hidden sm:inline' : ''}`} />
    </Link>
  );
}
