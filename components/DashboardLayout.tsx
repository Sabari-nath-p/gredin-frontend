'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  BarChart3,
  Layers,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Target
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
  { name: 'Trades', href: '/dashboard/trades', icon: TrendingUp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Templates', href: '/dashboard/templates', icon: Layers },
  { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

const mobileBottomNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
  { name: 'Trades', href: '/dashboard/trades', icon: TrendingUp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col
          bg-white border-r border-slate-300 shadow-sidebar
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b border-slate-300">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/newLogo.png" alt="Gredin" width={180} height={50} priority />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User chip */}
        <div className="px-4 py-4 border-b border-slate-300">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-primary to-green-secondary border border-green-dark">
            <div className="w-9 h-9 rounded-xl bg-gradient-green flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.name || 'Trader'}
              </p>
              <p className="text-xs text-emerald-100/80 truncate leading-tight mt-0.5">{user?.email}</p>
            </div>
          </div>

          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/admin"
              className="mt-2 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-purple-primary bg-purple-primary/10 border border-purple-primary/25 hover:bg-purple-primary/15 rounded-xl transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-gray-muted uppercase tracking-widest">
            Navigation
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-green-primary to-green-secondary text-white border border-green-dark'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-primary rounded-r-full" />
                )}
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-muted group-hover:text-slate-900'}`}
                />
                <span className="font-medium text-sm flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="px-4 py-4 space-y-2 border-t border-slate-300">
          <Link
            href="/dashboard/trades/new"
            className="btn-primary w-full justify-center gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <PlusCircle className="w-4 h-4" />
            New Trade
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-600 hover:text-red-primary hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-300 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="lg:hidden">
                <Image src="/newLogo.png" alt="Gredin" width={160} height={45} priority />
              </div>
              {/* Desktop breadcrumb */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs font-medium text-gray-muted">Gredin</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-muted" />
                <span className="text-sm font-semibold text-slate-900">
                  {navigation.find(n =>
                    pathname === n.href ||
                    (n.href !== '/dashboard' && pathname.startsWith(n.href))
                  )?.name || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/trades/new"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-primary bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 hover:border-green-200 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Quick Trade
              </Link>
              <Link
                href="/dashboard/profile"
                className="w-8 h-8 rounded-lg bg-gradient-green flex items-center justify-center text-white font-bold text-xs shadow-sm hover:shadow-glow-green transition-shadow"
              >
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 pb-24 md:pb-6 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-slate-300 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {mobileBottomNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors
                  ${isActive
                    ? 'text-green-primary'
                    : 'text-gray-muted hover:text-slate-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
