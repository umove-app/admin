'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { PaymentStats } from '@/lib/types';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface DetailedPaymentStats {
  date: string;
  amount: number;
  count: number;
  provider: string;
  status?: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  successCount?: number;
  failedCount?: number;
  refundedCount?: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // State
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [payments, setPayments] = useState<DetailedPaymentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Check authorization
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch data
  useEffect(() => {
    if (startDate && endDate) {
      fetchPaymentStats();
    }
  }, [startDate, endDate]);

  const fetchPaymentStats = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminApi.getPaymentStats(startDate, endDate);

      if (response.data) {
        const data = response.data;

        // Calculate summary stats
        const summaryStats: PaymentStats = {
          totalRevenue: data.totalRevenue || 0,
          totalTransactions: data.totalTransactions || 0,
          paystackRevenue: data.paystackRevenue || 0,
          stripeRevenue: data.stripeRevenue || 0,
          previousTotalRevenue: data.previousTotalRevenue,
          previousTotalTransactions: data.previousTotalTransactions,
          previousPaystackRevenue: data.previousPaystackRevenue,
          previousStripeRevenue: data.previousStripeRevenue,
        };

        setStats(summaryStats);

        // Process payment details
        const paymentDetails: DetailedPaymentStats[] = Array.isArray(data.payments)
          ? data.payments
          : [];

        setPayments(paymentDetails);
        setTotalPages(Math.ceil(paymentDetails.length / 15) || 1);
        setPage(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payment stats');
      console.error('Error fetching payment stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const calculatePercentageChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const getTrendIcon = (change: number | null) => {
    if (change === null) return null;
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    );
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (providerFilter && p.provider !== providerFilter) return false;
    if (statusFilter) {
      // For detailed stats, status may not always be available
      // Filter only if it exists on the payment object
      if ('status' in p && p.status !== statusFilter) return false;
    }
    return true;
  });

  const paginatedPayments = filteredPayments.slice(
    (page - 1) * 15,
    page * 15
  );

  // Loading state
  if (!startDate || !endDate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const revenueChange = calculatePercentageChange(
    stats?.totalRevenue || 0,
    stats?.previousTotalRevenue
  );

  const transactionChange = calculatePercentageChange(
    stats?.totalTransactions || 0,
    stats?.previousTotalTransactions
  );

  const paystackChange = calculatePercentageChange(
    stats?.paystackRevenue || 0,
    stats?.previousPaystackRevenue
  );

  const stripeChange = calculatePercentageChange(
    stats?.stripeRevenue || 0,
    stats?.previousStripeRevenue
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and analyze all payment transactions and revenue
        </p>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={fetchPaymentStats}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
              {revenueChange !== null && (
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(parseFloat(revenueChange))}
                  <span
                    className={`ml-1 font-medium ${
                      parseFloat(revenueChange) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {revenueChange}%
                  </span>
                  <span className="text-gray-500 ml-2">vs previous period</span>
                </div>
              )}
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Transactions
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.totalTransactions || 0}
              </p>
              {transactionChange !== null && (
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(parseFloat(transactionChange))}
                  <span
                    className={`ml-1 font-medium ${
                      parseFloat(transactionChange) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transactionChange}%
                  </span>
                  <span className="text-gray-500 ml-2">vs previous period</span>
                </div>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Paystack Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Paystack Revenue
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.paystackRevenue || 0)}
              </p>
              {paystackChange !== null && (
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(parseFloat(paystackChange))}
                  <span
                    className={`ml-1 font-medium ${
                      parseFloat(paystackChange) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {paystackChange}%
                  </span>
                  <span className="text-gray-500 ml-2">vs previous period</span>
                </div>
              )}
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Stripe Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Stripe Revenue
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.stripeRevenue || 0)}
              </p>
              {stripeChange !== null && (
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(parseFloat(stripeChange))}
                  <span
                    className={`ml-1 font-medium ${
                      parseFloat(stripeChange) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {stripeChange}%
                  </span>
                  <span className="text-gray-500 ml-2">vs previous period</span>
                </div>
              )}
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Provider
            </label>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Providers</option>
              <option value="PAYSTACK">Paystack</option>
              <option value="STRIPE">Stripe</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment, index) => (
                  <tr key={`${payment.date}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          'status' in payment
                            ? payment.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {'status' in payment ? payment.status : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          payment.provider === 'PAYSTACK'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {payment.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No payment data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 15 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Note:</span> This dashboard is for Super Admins only.
          Data is automatically refreshed. Percentage changes are calculated against the same period
          from the previous month. All amounts are shown in NGN (Nigerian Naira).
        </p>
      </div>
    </div>
  );
}
