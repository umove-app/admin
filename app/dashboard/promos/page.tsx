'use client';

import { useEffect, useState } from 'react';
import { promoApi } from '@/lib/api';
import { Promo } from '@/lib/types';
import { useDialog } from '@/components/ui/action-dialog';
import { Edit, Trash2, Plus, ToggleLeft, BarChart3 } from 'lucide-react';

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [promoStats, setPromoStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const { alert, confirm } = useDialog();
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: '',
    maxUses: '',
    maxUsesPerUser: '',
    startDate: '',
    endDate: '',
    minOrderAmount: '',
  });

  useEffect(() => {
    fetchPromos();
  }, [page, statusFilter]);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const isActive = statusFilter === '' ? undefined : statusFilter === 'active';
      const response = await promoApi.getAllPromos(page, 20, isActive);
      setPromos(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setError('');
    } catch (err: any) {
      setError('Failed to fetch promos');
      console.error('Failed to fetch promos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedPromo(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      maxUses: '',
      maxUsesPerUser: '',
      startDate: '',
      endDate: '',
      minOrderAmount: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = async (promo: Promo) => {
    try {
      const response = await promoApi.getPromoById(promo.id);
      const promoData = response.data;
      setSelectedPromo(promoData);
      setIsEditing(true);
      setFormData({
        code: promoData.code,
        discountType: promoData.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
        discountValue: promoData.discountValue.toString(),
        maxUses: promoData.maxUsageCount?.toString() || '',
        maxUsesPerUser: promoData.maxUsagePerUser?.toString() || '',
        startDate: promoData.startDate ? formatDateForInput(new Date(promoData.startDate)) : '',
        endDate: formatDateForInput(new Date(promoData.expiresAt)),
        minOrderAmount: promoData.minOrderValue?.toString() || '',
      });
      setShowModal(true);
    } catch (err: any) {
      await alert({
        title: 'Promo details unavailable',
        message: 'Failed to load promo details. Please try again.',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
      setError('Promo code is required');
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && parseFloat(formData.discountValue) > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      // Helper to convert date string to ISO format properly
      const toISODate = (dateStr: string, endOfDay = false): string | undefined => {
        if (!dateStr) return undefined; // Return undefined instead of null to exclude from payload
        // Input is in YYYY-MM-DD format from date input
        // Append time component to create valid ISO string
        const timeComponent = endOfDay ? 'T23:59:59.000Z' : 'T00:00:00.000Z';
        return `${dateStr}${timeComponent}`;
      };

      // Build payload, only including defined values
      const payload: Record<string, any> = {
        code: formData.code.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
      };

      // Only add optional fields if they have values
      if (formData.maxUses) payload.maxUsageCount = parseInt(formData.maxUses);
      if (formData.maxUsesPerUser) payload.maxUsagePerUser = parseInt(formData.maxUsesPerUser);
      if (formData.minOrderAmount) payload.minOrderValue = parseFloat(formData.minOrderAmount);

      const startDateValue = toISODate(formData.startDate, false);
      const expiresAtValue = toISODate(formData.endDate, true);
      if (startDateValue) payload.startDate = startDateValue;
      if (expiresAtValue) payload.expiresAt = expiresAtValue;

      if (isEditing && selectedPromo) {
        await promoApi.updatePromo(selectedPromo.id, payload);
        await alert({
          title: 'Promo updated',
          message: 'The promo was updated successfully.',
          intent: 'success',
          confirmText: 'Done',
          cancelText: 'Close',
        });
      } else {
        await promoApi.createPromo(payload);
        await alert({
          title: 'Promo created',
          message: 'The promo was created successfully.',
          intent: 'success',
          confirmText: 'Done',
          cancelText: 'Close',
        });
      }

      setShowModal(false);
      fetchPromos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save promo');
    }
  };

  const handleDelete = async (promoId: string) => {
    const confirmed = await confirm({
      title: 'Delete promo',
      message: 'This action cannot be undone. The promo will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      intent: 'danger',
    });
    if (!confirmed) return;

    try {
      await promoApi.deletePromo(promoId);
      await alert({
        title: 'Promo deleted',
        message: 'The promo has been removed successfully.',
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchPromos();
    } catch (err: any) {
      await alert({
        title: 'Delete failed',
        message: err.response?.data?.message || 'Failed to delete promo',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleToggleActive = async (promo: Promo) => {
    try {
      if (promo.isActive) {
        await promoApi.deactivatePromo(promo.id);
        await alert({
          title: 'Promo deactivated',
          message: 'The promo has been deactivated.',
          intent: 'success',
          confirmText: 'Done',
          cancelText: 'Close',
        });
      } else {
        await promoApi.activatePromo(promo.id);
        await alert({
          title: 'Promo activated',
          message: 'The promo is now active.',
          intent: 'success',
          confirmText: 'Done',
          cancelText: 'Close',
        });
      }
      fetchPromos();
    } catch (err: any) {
      await alert({
        title: 'Update failed',
        message: err.response?.data?.message || 'Failed to update promo status',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const handleViewStats = async (promo: Promo) => {
    try {
      const response = await promoApi.getPromoStats(promo.id);
      setPromoStats(response.data);
      setSelectedPromo(promo);
      setShowStatsModal(true);
    } catch (err: any) {
      await alert({
        title: 'Stats unavailable',
        message: 'Failed to load promo statistics. Please try again.',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getDiscountTypeLabel = (type: string) => {
    return type === 'PERCENTAGE' ? '%' : 'NGN';
  };

  if (loading && promos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Promo Management</h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Promo
        </button>
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
            <option value="">All Promos</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Promos Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Uses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{promo.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {promo.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promo.discountValue}{getDiscountTypeLabel(promo.discountType)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promo.maxUsageCount || 'Unlimited'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{promo.currentUsageCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(promo.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(promo.expiresAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        promo.isActive
                      )}`}
                    >
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewStats(promo)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Stats"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(promo)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Promo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(promo)}
                        className={promo.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                        title={promo.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <ToggleLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Promo"
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditing ? 'Edit Promo' : 'Create New Promo'}
              </h3>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Promo Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., SAVE20"
                      disabled={isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (NGN)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(NGN)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Uses (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Unlimited if empty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Uses Per User (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxUsesPerUser}
                      onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Order Amount (NGN, Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {isEditing ? 'Update Promo' : 'Create Promo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats Modal */}
      {showStatsModal && selectedPromo && promoStats && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowStatsModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Usage Statistics - {selectedPromo.code}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Uses</p>
                  <p className="text-2xl font-bold text-blue-600">{promoStats.totalUses || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Max Uses</p>
                  <p className="text-2xl font-bold text-green-600">{promoStats.maxUses || 'Unlimited'}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Discount Given</p>
                  <p className="text-2xl font-bold text-purple-600">NGN {promoStats.totalDiscountAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-orange-600">{promoStats.uniqueUsers || 0}</p>
                </div>
              </div>

              {promoStats.usagesByDate && promoStats.usagesByDate.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Usage by Date</h4>
                  <div className="space-y-2">
                    {promoStats.usagesByDate.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{formatDate(item.date)}</span>
                        <span className="text-sm font-medium text-gray-900">{item.count} uses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
