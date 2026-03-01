'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

interface Props {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'primary' | 'outline';
}

export default function LandingCTAButton({ size = 'default', variant = 'primary' }: Props) {
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
        className={`inline-flex items-center gap-2.5 font-bold rounded-xl transition-all group ${sizeClasses} ${
          variant === 'primary'
            ? 'btn-primary'
            : 'border-2 border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        Open My Console
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={`inline-flex items-center gap-2.5 font-bold rounded-xl transition-all group ${sizeClasses} ${
        variant === 'primary'
          ? 'btn-primary'
          : 'border-2 border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/10 hover:border-[#00ff88]'
      }`}
    >
      Get Started — It&apos;s Free
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
