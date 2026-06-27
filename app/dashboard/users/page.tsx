'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { User, UserRole } from '@/lib/types';
import { useDialog } from '@/components/ui/action-dialog';
import { Search, UserCheck, UserX, Trash2, Eye } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { alert, confirm, prompt } = useDialog();

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllUsers(
        page,
        20,
        roleFilter as UserRole,
        search
      );
      setUsers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSuspend = async (user: User) => {
    const result = await prompt({
      title: `Suspend ${user.firstName} ${user.lastName}`,
      message: 'Provide a clear reason for suspension. This will block the user from accessing the app.',
      confirmText: 'Suspend',
      cancelText: 'Cancel',
      intent: 'danger',
      inputLabel: 'Suspension reason',
      inputPlaceholder: 'e.g., Repeated policy violations',
    });

    if (!result.confirmed) return;

    try {
      const reason = result.value?.trim();
      if (!reason) {
        await alert({
          title: 'Reason required',
          message: 'Please provide a reason to suspend this user.',
          intent: 'warning',
          confirmText: 'Got it',
        });
        return;
      }

      await adminApi.suspendUser(user.id, reason);
      await alert({
        title: 'User suspended',
        message: `${user.firstName} ${user.lastName} has been suspended.`,
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchUsers();
    } catch (err: any) {
      await alert({
        title: 'Suspension failed',
        message: err.response?.data?.message || 'Failed to suspend user',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleActivate = async (user: User) => {
    const confirmed = await confirm({
      title: `Activate ${user.firstName} ${user.lastName}`,
      message: 'This will restore access to the platform for this user.',
      confirmText: 'Activate',
      cancelText: 'Cancel',
      intent: 'success',
    });

    if (!confirmed) return;

    try {
      await adminApi.activateUser(user.id);
      await alert({
        title: 'User activated',
        message: `${user.firstName} ${user.lastName} can now access the platform.`,
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchUsers();
    } catch (err: any) {
      await alert({
        title: 'Activation failed',
        message: err.response?.data?.message || 'Failed to activate user',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = await confirm({
      title: `Delete ${user.firstName} ${user.lastName}`,
      message: 'This action cannot be undone. All user data will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      intent: 'danger',
    });

    if (!confirmed) return;

    try {
      await adminApi.deleteUser(user.id);
      await alert({
        title: 'User deleted',
        message: 'The user has been removed successfully.',
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchUsers();
    } catch (err: any) {
      await alert({
        title: 'Delete failed',
        message: err.response?.data?.message || 'Failed to delete user',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value={UserRole.CUSTOMER}>Customer</option>
            <option value={UserRole.DRIVER}>Driver</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.ADMIN_SUPERVISOR}>Admin Supervisor</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                    <div className="text-xs text-gray-500">
                      {user.isPhoneVerified ? (
                        <span className="text-green-600">✓ Verified</span>
                      ) : (
                        <span className="text-red-600">Not verified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View User"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {user.isActive ? (
                        <button
                          onClick={() => handleSuspend(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Suspend User"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user)}
                          className="text-green-600 hover:text-green-900"
                          title="Activate User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
