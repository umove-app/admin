'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { settingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemSettings {
  id?: string;
  vatPercentage: number;
  minimumFare: number;
  cancellationFeePercentage: number;
  driverCommissionPercentage: number;
  maxSearchRadiusKm: number;
  driverAcceptanceTimeoutMinutes: number;
  autoAssignDriver: boolean;
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  companyName: string;
  companyAddress: string;
}

interface NotificationState {
  type: 'success' | 'error' | null;
  message: string;
}

const defaultSettings: SystemSettings = {
  vatPercentage: 0,
  minimumFare: 0,
  cancellationFeePercentage: 0,
  driverCommissionPercentage: 0,
  maxSearchRadiusKm: 0,
  driverAcceptanceTimeoutMinutes: 0,
  autoAssignDriver: false,
  supportEmail: '',
  supportPhone: '',
  supportAddress: '',
  companyName: '',
  companyAddress: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    type: null,
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SystemSettings, string>>>({});

  // Check authorization - Super Admin only
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch settings';
      setNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SystemSettings, string>> = {};

    if (settings.vatPercentage < 0 || settings.vatPercentage > 100) {
      newErrors.vatPercentage = 'VAT must be between 0 and 100%';
    }

    if (settings.minimumFare < 0) {
      newErrors.minimumFare = 'Minimum fare cannot be negative';
    }

    if (settings.cancellationFeePercentage < 0 || settings.cancellationFeePercentage > 100) {
      newErrors.cancellationFeePercentage = 'Cancellation fee must be between 0 and 100%';
    }

    if (settings.driverCommissionPercentage < 0 || settings.driverCommissionPercentage > 100) {
      newErrors.driverCommissionPercentage = 'Commission must be between 0 and 100%';
    }

    if (settings.maxSearchRadiusKm < 1) {
      newErrors.maxSearchRadiusKm = 'Search radius must be at least 1 km';
    }

    if (settings.driverAcceptanceTimeoutMinutes < 1) {
      newErrors.driverAcceptanceTimeoutMinutes = 'Timeout must be at least 1 minute';
    }

    if (!settings.supportEmail?.trim()) {
      newErrors.supportEmail = 'Support email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) {
      newErrors.supportEmail = 'Invalid email format';
    }

    if (!settings.supportPhone?.trim()) {
      newErrors.supportPhone = 'Support phone is required';
    }

    if (!settings.supportAddress?.trim()) {
      newErrors.supportAddress = 'Support address is required';
    }

    if (!settings.companyName?.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!settings.companyAddress?.trim()) {
      newErrors.companyAddress = 'Company address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof SystemSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts editing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification({
        type: 'error',
        message: 'Please fix all validation errors',
      });
      return;
    }

    try {
      setSaving(true);
      await settingsApi.updateSettings(settings);
      setNotification({
        type: 'success',
        message: 'Settings updated successfully',
      });

      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      setNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage platform-wide configuration and settings.
        </p>
      </div>

      {/* Notification */}
      {notification.type && (
        <div
          className={`flex items-start gap-4 p-4 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {notification.message}
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pricing Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-600 rounded"></div>
            Pricing Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAT Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.vatPercentage}
                onChange={(e) =>
                  handleInputChange('vatPercentage', parseFloat(e.target.value))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.vatPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.vatPercentage && (
                <p className="mt-1 text-sm text-red-600">{errors.vatPercentage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Fare (NGN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.minimumFare}
                onChange={(e) =>
                  handleInputChange('minimumFare', parseFloat(e.target.value))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.minimumFare ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.minimumFare && (
                <p className="mt-1 text-sm text-red-600">{errors.minimumFare}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Fee Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.cancellationFeePercentage}
                onChange={(e) =>
                  handleInputChange('cancellationFeePercentage', parseFloat(e.target.value))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.cancellationFeePercentage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cancellationFeePercentage && (
                <p className="mt-1 text-sm text-red-600">{errors.cancellationFeePercentage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Commission Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.driverCommissionPercentage}
                onChange={(e) =>
                  handleInputChange('driverCommissionPercentage', parseFloat(e.target.value))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.driverCommissionPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.driverCommissionPercentage && (
                <p className="mt-1 text-sm text-red-600">{errors.driverCommissionPercentage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Driver Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-green-600 rounded"></div>
            Driver Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Search Radius (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={settings.maxSearchRadiusKm}
                onChange={(e) =>
                  handleInputChange('maxSearchRadiusKm', parseFloat(e.target.value))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.maxSearchRadiusKm ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.maxSearchRadiusKm && (
                <p className="mt-1 text-sm text-red-600">{errors.maxSearchRadiusKm}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Acceptance Timeout (minutes)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={settings.driverAcceptanceTimeoutMinutes}
                onChange={(e) =>
                  handleInputChange('driverAcceptanceTimeoutMinutes', parseInt(e.target.value))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.driverAcceptanceTimeoutMinutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.driverAcceptanceTimeoutMinutes && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.driverAcceptanceTimeoutMinutes}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoAssignDriver}
                  onChange={(e) =>
                    handleInputChange('autoAssignDriver', e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Auto Assign Driver to Orders
                </span>
              </label>
              <p className="mt-1 ml-8 text-xs text-gray-500">
                Automatically assign nearby drivers to new orders
              </p>
            </div>
          </div>
        </div>

        {/* Support Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-orange-600 rounded"></div>
            Support Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.supportEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="support@example.com"
              />
              {errors.supportEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.supportEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Phone
              </label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.supportPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+234 (0) 800 000 0000"
              />
              {errors.supportPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.supportPhone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Address
              </label>
              <textarea
                value={settings.supportAddress}
                onChange={(e) => handleInputChange('supportAddress', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                  errors.supportAddress ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123 Main Street, City, Country"
              />
              {errors.supportAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.supportAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Company Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-purple-600 rounded"></div>
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="UMove"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address
              </label>
              <textarea
                value={settings.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                  errors.companyAddress ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123 Main Street, City, Country"
              />
              {errors.companyAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.companyAddress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => fetchSettings()}
            disabled={loading || saving}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
