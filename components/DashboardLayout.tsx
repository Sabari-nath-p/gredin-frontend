'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
  { name: 'Trades', href: '/dashboard/trades', icon: TrendingUp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen bg-dark-bg">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[280px] bg-dark-card/95 backdrop-blur-xl border-r border-dark-border
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-dark-border">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-green rounded-xl flex items-center justify-center shadow-glow-green group-hover:shadow-lg transition-shadow">
                <TrendingUp className="w-5 h-5 text-dark-bg" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Gredin</h1>
                <p className="text-[10px] text-gray-text uppercase tracking-widest">Professional</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-text hover:text-green-primary transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-5 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-green rounded-full flex items-center justify-center ring-2 ring-green-primary/20">
                <span className="text-base font-bold text-dark-bg">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-light truncate">
                  {user?.name || 'Trader'}
                </p>
                <p className="text-xs text-gray-text truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="px-3 pt-2 pb-3 text-[10px] font-semibold text-gray-text/60 uppercase tracking-widest">
              Menu
            </p>
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                    ${isActive
                      ? 'bg-green-primary/10 text-green-primary'
                      : 'text-gray-text hover:bg-dark-bg hover:text-gray-light'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-green-primary rounded-r-full" />
                  )}
                  <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-green-primary' : 'group-hover:text-gray-light'}`} />
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 space-y-2 border-t border-dark-border">
            <Link
              href="/dashboard/trades/new"
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
              onClick={() => setSidebarOpen(false)}
            >
              <PlusCircle className="w-4 h-4" />
              New Trade
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-text hover:text-red-primary hover:bg-red-primary/5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border/50">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-text hover:text-green-primary transition-colors p-1.5 rounded-lg hover:bg-dark-card"
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center gap-2">
                <div className="w-8 h-8 bg-gradient-green rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-dark-bg" />
                </div>
                <span className="font-bold gradient-text text-sm">Gredin</span>
              </div>
              {/* Breadcrumb - desktop */}
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-gray-text">
                  {navigation.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.name || 'Dashboard'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/trades/new"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-primary bg-green-primary/10 border border-green-primary/20 rounded-lg hover:bg-green-primary/15 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Quick Trade
              </Link>
              <Link
                href="/dashboard/profile"
                className="w-8 h-8 bg-gradient-green rounded-lg flex items-center justify-center text-dark-bg font-bold text-xs hover:shadow-glow-green transition-shadow"
              >
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-57px)] p-4 pb-24 md:pb-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-dark-border bg-dark-card/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {mobileBottomNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors
                  ${isActive ? 'text-green-primary bg-green-primary/10' : 'text-gray-text hover:text-gray-light hover:bg-dark-bg/80'}
                `}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] font-semibold leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
