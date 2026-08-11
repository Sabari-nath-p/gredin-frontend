'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronLeft, ChevronRight, ShieldCheck, User as UserIcon,
  CheckCircle2, XCircle, Wallet, Layers, MessageSquare, Mail,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { adminApi, type AdminUserListItem } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type RoleFilter = 'ALL' | 'SUPER_ADMIN' | 'USER';
type StatusFilter = 'ALL' | 'active' | 'inactive';

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, statusFilter]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminApi.getUsers(token, {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleStatus = async (user: AdminUserListItem) => {
    if (!token) return;
    setUpdatingId(user.id);
    try {
      await adminApi.setUserStatus(token, user.id, !user.isActive);
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">User Management</h1>
        <p className="text-slate-600 text-sm">{meta.total} registered user{meta.total !== 1 ? 's' : ''} on the platform</p>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input pl-9 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1">
            {(['ALL', 'USER', 'SUPER_ADMIN'] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${roleFilter === r ? 'bg-purple-primary/15 text-purple-primary' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {r === 'ALL' ? 'All Roles' : r === 'SUPER_ADMIN' ? 'Admins' : 'Users'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl p-1">
            {(['ALL', 'active', 'inactive'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize whitespace-nowrap ${statusFilter === s ? 'bg-purple-primary/15 text-purple-primary' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {s === 'ALL' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Accounts</th>
              <th>Templates</th>
              <th>Chats</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={8}><div className="skeleton h-8 rounded-lg" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-600">No users match these filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${user.role === 'SUPER_ADMIN' ? 'bg-purple-primary/10' : 'bg-green-primary/10'}`}>
                        <span className={`text-xs font-bold ${user.role === 'SUPER_ADMIN' ? 'text-purple-primary' : 'text-green-primary'}`}>
                          {(user.name || user.email)[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm group-hover:text-purple-primary transition-colors truncate">
                          {user.name || 'Unnamed'}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />{user.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-info' : 'badge-warning'}`}>
                      {user.role === 'SUPER_ADMIN'
                        ? <><ShieldCheck className="w-3 h-3" /> Admin</>
                        : <><UserIcon className="w-3 h-3" /> User</>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive
                        ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                        : <><XCircle className="w-3 h-3" /> Inactive</>}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                      <Wallet className="w-3 h-3 text-slate-400" />{user._count?.tradeAccounts ?? 0}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                      <Layers className="w-3 h-3 text-slate-400" />{user._count?.logTemplates ?? 0}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                      <MessageSquare className="w-3 h-3 text-slate-400" />{user._count?.chatSessions ?? 0}
                    </span>
                  </td>
                  <td className="text-xs text-slate-600 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-xs font-semibold text-purple-primary hover:text-purple-600 transition-colors"
                      >
                        View
                      </Link>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleStatus(user)}
                          disabled={updatingId === user.id}
                          className={`text-xs font-semibold transition-colors disabled:opacity-50 ${user.isActive ? 'text-red-primary hover:text-red-secondary' : 'text-green-primary hover:text-green-secondary'
                            }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center hover:border-purple-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center hover:border-purple-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
