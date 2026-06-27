'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { User, UserRole } from '@/lib/types';
import { useDialog } from '@/components/ui/action-dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  ShieldX,
  Calendar,
  MapPin,
  UserCircle,
} from 'lucide-react';

export default function UserDetailsPage() {
  const params = useParams();
  const userId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { alert } = useDialog();

  useEffect(() => {
    if (!userId) return;

    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUserById(userId);
        setUser(response.data);
      } catch (err: any) {
        await alert({
          title: 'User not found',
          message: err.response?.data?.message || 'Failed to load user details.',
          intent: 'danger',
          confirmText: 'Retry',
          cancelText: 'Close',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, alert]);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case UserRole.ADMIN_SUPERVISOR:
        return 'bg-indigo-100 text-indigo-800';
      case UserRole.DRIVER:
        return 'bg-green-100 text-green-800';
      case UserRole.CUSTOMER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-600">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/users"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to users
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">User Details</h1>
        </div>
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
            user.role
          )}`}
        >
          {user.role}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <UserCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="ml-auto">
            {user.isActive ? (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Active
              </span>
            ) : (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Suspended
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{user.phoneNumber || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{user.country || 'Location not set'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Verification</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Email verified</span>
            {user.isEmailVerified ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : (
              <ShieldX className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Phone verified</span>
            {user.isPhoneVerified ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : (
              <ShieldX className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Account</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Status</span>
            <span className="font-medium text-gray-900">{user.status || 'ACTIVE'}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Last login</span>
            <span className="font-medium text-gray-900">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not available'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>User ID</span>
            <span className="font-mono text-xs text-gray-500">{user.id}</span>
          </div>
        </div>
      </div>

      {user.role === UserRole.DRIVER && user.driverProfile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Driver Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">License</p>
              <p className="mt-1 text-gray-900">{user.driverProfile.licenseNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Verification</p>
              <p className="mt-1 text-gray-900">
                {user.driverProfile.verificationStatus || 'PENDING'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Online status</p>
              <p className="mt-1 text-gray-900">
                {user.driverProfile.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          {user.driverProfile.rejectionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Rejection reason</p>
              <p className="mt-1">{user.driverProfile.rejectionReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
