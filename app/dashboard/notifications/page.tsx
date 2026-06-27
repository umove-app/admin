'use client';

import { useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api';
import { Bell, Send, CheckCircle, Clock, Eye, X, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  status: string;
  audienceGroup?: string;
  userId?: string;
  imageUrl?: string;
  sentAt: string;
  createdAt?: string;
}

type AudienceType = 'INDIVIDUAL' | 'ALL_CUSTOMERS' | 'ALL_DRIVERS';
type NotificationType = 'ORDER_CREATED' | 'PROMO_AVAILABLE' | 'SYSTEM_ANNOUNCEMENT';

export default function NotificationsPage() {
  // Form state
  const [audience, setAudience] = useState<AudienceType>('ALL_CUSTOMERS');
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<NotificationType>('ORDER_CREATED');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sendingLoading, setSendingLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  // List state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setListLoading(true);
      const response = await notificationApi.getAllNotifications(page, 10);
      setNotifications(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      showToast('error', 'Failed to fetch notifications');
    } finally {
      setListLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      showToast('error', 'Title is required');
      return false;
    }
    if (!body.trim()) {
      showToast('error', 'Message is required');
      return false;
    }
    if (audience === 'INDIVIDUAL' && !userId.trim()) {
      showToast('error', 'User ID is required for individual notifications');
      return false;
    }
    return true;
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSendingLoading(true);
      setSendError('');

      const payload: any = {
        title: title.trim(),
        body: body.trim(),
        type,
      };

      // Add optional fields
      if (imageUrl.trim()) {
        payload.imageUrl = imageUrl.trim();
      }

      if (audience === 'INDIVIDUAL') {
        payload.userId = userId.trim();
      } else if (audience === 'ALL_CUSTOMERS') {
        payload.audienceGroup = 'ALL_CUSTOMERS';
      } else if (audience === 'ALL_DRIVERS') {
        payload.audienceGroup = 'ALL_DRIVERS';
      }

      await notificationApi.sendNotification(payload);

      showToast('success', 'Notification sent successfully!');
      setSendSuccess(true);

      // Clear form
      setTitle('');
      setBody('');
      setImageUrl('');
      setUserId('');
      setAudience('ALL_CUSTOMERS');
      setType('ORDER_CREATED');

      // Reset success message after 3 seconds
      setTimeout(() => setSendSuccess(false), 3000);

      // Refresh notification list
      setPage(1);
      fetchNotifications();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to send notification. Please try again.';
      setSendError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setSendingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-green-100 text-green-800',
      READ: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'SENT':
        return <CheckCircle className="w-4 h-4" />;
      case 'READ':
        return <Eye className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ORDER_CREATED: 'bg-purple-100 text-purple-800',
      DRIVER_ASSIGNED: 'bg-blue-100 text-blue-800',
      DRIVER_ARRIVED: 'bg-cyan-100 text-cyan-800',
      ORDER_STARTED: 'bg-yellow-100 text-yellow-800',
      ORDER_COMPLETED: 'bg-green-100 text-green-800',
      ORDER_CANCELLED: 'bg-orange-100 text-orange-800',
      PAYMENT_SUCCESS: 'bg-emerald-100 text-emerald-800',
      PAYMENT_FAILED: 'bg-red-100 text-red-800',
      KYC_APPROVED: 'bg-green-100 text-green-800',
      KYC_REJECTED: 'bg-red-100 text-red-800',
      PROMO_AVAILABLE: 'bg-pink-100 text-pink-800',
      SYSTEM_ANNOUNCEMENT: 'bg-red-100 text-red-800',
      CUSTOM: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      INDIVIDUAL: 'Individual User',
      ALL_CUSTOMERS: 'All Customers',
      ALL_DRIVERS: 'All Drivers',
    };
    return labels[audience] || audience;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifications Management</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Bell className="w-5 h-5" />
          Compose & Monitor Notifications
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compose Notification Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          Compose New Notification
        </h2>

        <form onSubmit={handleSendNotification} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audience Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audience <span className="text-red-500">*</span>
              </label>
              <select
                value={audience}
                onChange={(e) => {
                  setAudience(e.target.value as AudienceType);
                  if (e.target.value !== 'INDIVIDUAL') {
                    setUserId('');
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="ALL_CUSTOMERS">All Customers</option>
                <option value="ALL_DRIVERS">All Drivers</option>
                <option value="INDIVIDUAL">Individual User</option>
              </select>
            </div>

            {/* User ID Field (conditional) */}
            {audience === 'INDIVIDUAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="ORDER_CREATED">Order Created</option>
                <option value="PROMO_AVAILABLE">Promo Available</option>
                <option value="SYSTEM_ANNOUNCEMENT">System Announcement</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Your order has been delivered"
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          {/* Message/Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter the notification message content"
              rows={5}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{body.length}/500 characters</p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Provide a valid image URL for the notification</p>
          </div>

          {/* Error Message */}
          {sendError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error sending notification</p>
                <p className="text-sm text-red-700 mt-1">{sendError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {sendSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Notification sent successfully!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your notification has been delivered to the selected audience.
                </p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setBody('');
                setImageUrl('');
                setUserId('');
                setAudience('ALL_CUSTOMERS');
                setType('ORDER_CREATED');
                setSendError('');
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={sendingLoading}
              className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-all flex items-center gap-2 ${
                sendingLoading
                  ? 'bg-indigo-400 cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {sendingLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Notification History
          </h2>
        </div>

        {/* Loading State */}
        {listLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No notifications sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {notification.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {notification.body}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {notification.userId
                          ? 'Individual User'
                          : (notification.audienceGroup ? getAudienceLabel(notification.audienceGroup) : 'Unknown')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            notification.status
                          )}`}
                        >
                          {getStatusIcon(notification.status)}
                          {notification.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(notification.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!listLoading && notifications.length > 0 && (
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
    </div>
  );
}
