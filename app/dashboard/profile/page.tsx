'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Shield, Edit2, Save, X, Calendar, Activity, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { userApi, type UpdateProfileRequest } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await userApi.updateProfile(token, { name: name.trim() || undefined });
      setAuth(response.data, token);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-light tracking-tight">Profile Settings</h1>
        <p className="text-sm text-gray-text mt-0.5">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-primary/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-green-primary">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-light">{user?.name || 'Trader'}</h2>
              <p className="text-sm text-gray-text">{user?.email}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-border text-gray-text hover:text-green-primary hover:border-green-primary/50 transition-all text-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-text uppercase tracking-wider mb-2">
              <UserIcon className="w-3.5 h-3.5" />
              Name
            </label>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="Enter your name"
              />
            ) : (
              <p className="text-gray-light font-medium">{user?.name || 'Not set'}</p>
            )}
          </div>

          <div className="divider-green"></div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-text uppercase tracking-wider mb-2">
              <Mail className="w-3.5 h-3.5" />
              Email
            </label>
            <p className="text-gray-light font-medium">{user?.email}</p>
            <p className="text-[10px] text-gray-text mt-1">Email cannot be changed</p>
          </div>

          <div className="divider-green"></div>

          {/* Role */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-text uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              Role
            </label>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              user?.role === 'SUPER_ADMIN' 
                ? 'bg-yellow-primary/10 text-yellow-primary' 
                : 'bg-blue-primary/10 text-blue-primary'
            }`}>
              {user?.role}
            </span>
          </div>

          <div className="divider-green"></div>

          {/* Account Info */}
          <div>
            <h3 className="text-xs font-medium text-gray-text uppercase tracking-wider mb-3">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-dark-bg/60 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-gray-text" />
                  <p className="text-[10px] text-gray-text">Created</p>
                </div>
                <p className="text-sm text-gray-light font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-dark-bg/60 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-gray-text" />
                  <p className="text-[10px] text-gray-text">Updated</p>
                </div>
                <p className="text-sm text-gray-light font-medium">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-dark-bg/60 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3 h-3 text-gray-text" />
                  <p className="text-[10px] text-gray-text">Status</p>
                </div>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  user?.isActive ? 'bg-green-primary/10 text-green-primary' : 'bg-red-primary/10 text-red-primary'
                }`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {editing && (
            <>
              <div className="divider-green"></div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setEditing(false); setName(user?.name || ''); }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-dark-bg/40">
        <h3 className="text-sm font-semibold text-gray-light mb-3">💡 Profile Tips</h3>
        <ul className="space-y-2 text-xs text-gray-text">
          <li className="flex items-start gap-2">
            <span className="text-green-primary mt-0.5">•</span>
            <span>Your profile name is displayed across the dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-primary mt-0.5">•</span>
            <span>Email is used for authentication and cannot be changed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-primary mt-0.5">•</span>
            <span>Keep your profile information up to date for better experience</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
