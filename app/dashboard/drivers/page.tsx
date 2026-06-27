'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { driverApi } from '@/lib/api';
import { User, VerificationStatus } from '@/lib/types';
import { useDialog } from '@/components/ui/action-dialog';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { alert, confirm, prompt } = useDialog();

  useEffect(() => {
    fetchDrivers();
  }, [page, statusFilter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getAllDrivers(page, 20, statusFilter);
      setDrivers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (driver: User) => {
    const confirmed = await confirm({
      title: `Verify ${driver.firstName} ${driver.lastName}`,
      message: 'This will approve the driver and allow them to accept trips.',
      confirmText: 'Verify',
      cancelText: 'Cancel',
      intent: 'success',
    });

    if (!confirmed) return;

    try {
      await driverApi.verifyDriver(driver.id);
      await alert({
        title: 'Driver verified',
        message: `${driver.firstName} ${driver.lastName} is now verified.`,
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchDrivers();
    } catch (err: any) {
      await alert({
        title: 'Verification failed',
        message: err.response?.data?.message || 'Failed to verify driver',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleReject = async (driver: User) => {
    const result = await prompt({
      title: `Reject ${driver.firstName} ${driver.lastName}`,
      message: 'Provide a reason for rejection. The driver will be notified.',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      intent: 'danger',
      inputLabel: 'Rejection reason',
      inputPlaceholder: 'e.g., Incomplete documents',
    });

    if (!result.confirmed) return;

    try {
      const reason = result.value?.trim();
      if (!reason) {
        await alert({
          title: 'Reason required',
          message: 'Please provide a reason to reject this driver.',
          intent: 'warning',
          confirmText: 'Got it',
        });
        return;
      }

      await driverApi.rejectDriver(driver.id, reason);
      await alert({
        title: 'Driver rejected',
        message: `${driver.firstName} ${driver.lastName} has been rejected.`,
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchDrivers();
    } catch (err: any) {
      await alert({
        title: 'Rejection failed',
        message: err.response?.data?.message || 'Failed to reject driver',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleSuspend = async (driver: User) => {
    const result = await prompt({
      title: `Suspend ${driver.firstName} ${driver.lastName}`,
      message: 'Provide a reason for suspension. This will block the driver from going online.',
      confirmText: 'Suspend',
      cancelText: 'Cancel',
      intent: 'danger',
      inputLabel: 'Suspension reason',
      inputPlaceholder: 'e.g., Safety violation',
    });

    if (!result.confirmed) return;

    try {
      const reason = result.value?.trim();
      if (!reason) {
        await alert({
          title: 'Reason required',
          message: 'Please provide a reason to suspend this driver.',
          intent: 'warning',
          confirmText: 'Got it',
        });
        return;
      }

      await driverApi.suspendDriver(driver.id, reason);
      await alert({
        title: 'Driver suspended',
        message: `${driver.firstName} ${driver.lastName} has been suspended.`,
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchDrivers();
    } catch (err: any) {
      await alert({
        title: 'Suspension failed',
        message: err.response?.data?.message || 'Failed to suspend driver',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return 'bg-green-100 text-green-800';
      case VerificationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value={VerificationStatus.PENDING}>Pending Verification</option>
            <option value={VerificationStatus.VERIFIED}>Verified</option>
            <option value={VerificationStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Online
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-semibold">
                          {driver.firstName[0]}{driver.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {driver.driverProfile?.licenseNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        driver.driverProfile?.verificationStatus || VerificationStatus.PENDING
                      )}`}
                    >
                      {driver.driverProfile?.verificationStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driver.driverProfile?.isOnline ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/drivers/${driver.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Driver"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {driver.driverProfile?.verificationStatus === VerificationStatus.PENDING && (
                        <>
                          <button
                            onClick={() => handleVerify(driver)}
                            className="text-green-600 hover:text-green-900"
                            title="Verify Driver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(driver)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject Driver"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {driver.driverProfile?.verificationStatus === VerificationStatus.VERIFIED && (
                        <button
                          onClick={() => handleSuspend(driver)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Suspend Driver"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
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
