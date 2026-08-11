'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  ArrowLeftCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col
          bg-slate-900 border-r border-slate-800 shadow-sidebar
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/newWhite.png" alt="Gredin" width={150} height={42} priority />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-primary/15 border border-purple-primary/30 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin chip */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-primary/20 to-slate-800 border border-purple-primary/30">
            <div className="w-9 h-9 rounded-xl bg-purple-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-slate-400 truncate leading-tight mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Admin Panel
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${isActive
                    ? 'bg-purple-primary/20 text-white border border-purple-primary/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-r-full" />
                )}
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-300' : 'text-slate-500 group-hover:text-white'}`}
                />
                <span className="font-medium text-sm flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="px-4 py-4 space-y-2 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <ArrowLeftCircle className="w-4 h-4" />
            Back to App
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-muted">Gredin Admin</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-muted" />
                <span className="text-sm font-semibold text-slate-900">
                  {navigation.find(n =>
                    pathname === n.href ||
                    (n.href !== '/admin' && pathname.startsWith(n.href))
                  )?.name || 'Overview'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-primary bg-purple-primary/10 border border-purple-primary/20 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                Super Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 pb-24 md:pb-6 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
