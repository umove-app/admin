'use client';

import { useEffect, useState } from 'react';
import { vehicleApi } from '@/lib/api';
import { VehicleType } from '@/lib/types';
import { useDialog } from '@/components/ui/action-dialog';
import { Plus, Edit, Trash2, Power, PowerOff, X } from 'lucide-react';

const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'Tanzania', 'Uganda', 'Ethiopia'];

interface VehicleFormData {
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  pricePerKm: number;
  availableCountries: string[];
  isActive: boolean;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { alert, confirm } = useDialog();
  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    description: '',
    capacity: 1,
    basePrice: 0,
    pricePerKm: 0,
    availableCountries: [],
    isActive: true,
  });

  useEffect(() => {
    fetchVehicles();
  }, [page]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await vehicleApi.getAllVehicleTypes(page, 20);
      setVehicles(response.data.data);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: 1,
      basePrice: 0,
      pricePerKm: 0,
      availableCountries: [],
      isActive: true,
    });
    setEditingVehicle(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (vehicle: VehicleType) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      description: vehicle.description,
      capacity: vehicle.capacity,
      basePrice: vehicle.basePrice,
      pricePerKm: vehicle.pricePerKm,
      availableCountries: [], // Note: API response doesn't include countries, adjust based on actual API
      isActive: vehicle.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      await alert({
        title: 'Missing vehicle name',
        message: 'Vehicle name is required.',
        intent: 'warning',
        confirmText: 'Got it',
      });
      return;
    }
    if (formData.capacity < 1) {
      await alert({
        title: 'Invalid capacity',
        message: 'Capacity must be at least 1.',
        intent: 'warning',
        confirmText: 'Got it',
      });
      return;
    }
    if (formData.basePrice < 0) {
      await alert({
        title: 'Invalid base price',
        message: 'Base price cannot be negative.',
        intent: 'warning',
        confirmText: 'Got it',
      });
      return;
    }
    if (formData.pricePerKm < 0) {
      await alert({
        title: 'Invalid price per km',
        message: 'Price per km cannot be negative.',
        intent: 'warning',
        confirmText: 'Got it',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingVehicle) {
        await vehicleApi.updateVehicleType(editingVehicle.id, formData);
        await alert({
          title: 'Vehicle updated',
          message: 'The vehicle type was updated successfully.',
          intent: 'success',
          confirmText: 'Done',
          cancelText: 'Close',
        });
      } else {
        await vehicleApi.createVehicleType(formData);
        await alert({
          title: 'Vehicle created',
          message: 'The vehicle type was created successfully.',
          intent: 'success',
          confirmText: 'Done',
          cancelText: 'Close',
        });
      }
      setShowModal(false);
      resetForm();
      fetchVehicles();
    } catch (err: any) {
      await alert({
        title: 'Save failed',
        message: err.response?.data?.message || 'Failed to save vehicle',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
      console.error('Failed to save vehicle:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    const confirmed = await confirm({
      title: 'Delete vehicle type',
      message: 'This action cannot be undone. The vehicle type will be removed permanently.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      intent: 'danger',
    });
    if (!confirmed) return;

    try {
      await vehicleApi.deleteVehicleType(vehicleId);
      await alert({
        title: 'Vehicle deleted',
        message: 'The vehicle type has been removed successfully.',
        intent: 'success',
        confirmText: 'Done',
        cancelText: 'Close',
      });
      fetchVehicles();
    } catch (err: any) {
      await alert({
        title: 'Delete failed',
        message: err.response?.data?.message || 'Failed to delete vehicle',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
      console.error('Failed to delete vehicle:', err);
    }
  };

  const toggleStatus = async (vehicle: VehicleType) => {
    try {
      await vehicleApi.updateVehicleType(vehicle.id, {
        ...vehicle,
        isActive: !vehicle.isActive,
      });
      fetchVehicles();
    } catch (err: any) {
      await alert({
        title: 'Status update failed',
        message: err.response?.data?.message || 'Failed to update status',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
      console.error('Failed to update status:', err);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Vehicle
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/Km
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
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">No vehicles found. Create one to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {vehicle.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.capacity} {vehicle.capacity === 1 ? 'item' : 'items'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(vehicle.basePrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(vehicle.pricePerKm)}/km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.isActive ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(vehicle)}
                          className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                            vehicle.isActive
                              ? 'text-green-600 hover:text-green-900'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title={
                            vehicle.isActive
                              ? 'Deactivate Vehicle'
                              : 'Activate Vehicle'
                          }
                        >
                          {vehicle.isActive ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Edit Vehicle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {vehicles.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingVehicle ? 'Edit Vehicle' : 'Create New Vehicle'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Standard Delivery Van"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the vehicle type and its use cases..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Capacity and Base Price Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity (items) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (NGN) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          basePrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Price Per Km */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Per Km (NGN) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formData.pricePerKm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerKm: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Available Countries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Countries
                  </label>
                  <div className="space-y-2">
                    {COUNTRIES.map((country) => (
                      <label
                        key={country}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.availableCountries.includes(
                            country
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                availableCountries: [
                                  ...prev.availableCountries,
                                  country,
                                ],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                availableCountries:
                                  prev.availableCountries.filter(
                                    (c) => c !== country
                                  ),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                    This vehicle type is active and available for orders
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting
                      ? 'Saving...'
                      : editingVehicle
                      ? 'Update Vehicle'
                      : 'Create Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
