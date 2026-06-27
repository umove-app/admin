'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/api';
import { useDialog } from '@/components/ui/action-dialog';
import {
  UserRegistrationStats,
  OrderStats,
  DriverPerformance,
  VehicleUtilization,
} from '@/lib/types';
import {
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  DollarSign,
  Download,
  BarChart3,
  Activity,
  Award,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = {
  customers: '#3B82F6',
  drivers: '#10B981',
  total: '#8B5CF6',
  completed: '#22C55E',
  cancelled: '#EF4444',
  revenue: '#F59E0B',
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { alert } = useDialog();
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
  });

  // Analytics data states
  const [userRegistrationStats, setUserRegistrationStats] = useState<UserRegistrationStats[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats[]>([]);
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [vehicleUtilization, setVehicleUtilization] = useState<VehicleUtilization[]>([]);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalDrivers: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const [userRegs, orders, drivers, vehicles] = await Promise.all([
        adminApi.getUserRegistrationStats(dateRange.startDate, dateRange.endDate),
        adminApi.getOrderStats(dateRange.startDate, dateRange.endDate),
        adminApi.getDriverPerformance(dateRange.startDate, dateRange.endDate),
        adminApi.getVehicleUtilization(dateRange.startDate, dateRange.endDate),
      ]);

      setUserRegistrationStats(userRegs.data);
      setOrderStats(orders.data);
      setDriverPerformance(drivers.data);
      setVehicleUtilization(vehicles.data);

      // Calculate summary stats
      calculateSummaryStats(userRegs.data, orders.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryStats = (userStats: UserRegistrationStats[], orderStats: OrderStats[]) => {
    const totalCustomers = userStats.reduce((sum, stat) => sum + stat.customers, 0);
    const totalDrivers = userStats.reduce((sum, stat) => sum + stat.drivers, 0);
    const totalUsers = totalCustomers + totalDrivers;

    const totalOrders = orderStats.reduce((sum, stat) => sum + stat.total, 0);
    const completedOrders = orderStats.reduce((sum, stat) => sum + stat.completed, 0);
    const cancelledOrders = orderStats.reduce((sum, stat) => sum + stat.cancelled, 0);
    const totalRevenue = orderStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    setSummaryStats({
      totalUsers,
      totalCustomers,
      totalDrivers,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue,
    });
  };

  // Calculate trends (compare first half vs second half of period)
  const userTrends = useMemo(() => {
    if (userRegistrationStats.length < 2) return { customers: 0, drivers: 0, total: 0 };

    const midpoint = Math.floor(userRegistrationStats.length / 2);
    const firstHalf = userRegistrationStats.slice(0, midpoint);
    const secondHalf = userRegistrationStats.slice(midpoint);

    const firstCustomers = firstHalf.reduce((sum, s) => sum + s.customers, 0);
    const secondCustomers = secondHalf.reduce((sum, s) => sum + s.customers, 0);
    const firstDrivers = firstHalf.reduce((sum, s) => sum + s.drivers, 0);
    const secondDrivers = secondHalf.reduce((sum, s) => sum + s.drivers, 0);
    const firstTotal = firstHalf.reduce((sum, s) => sum + s.total, 0);
    const secondTotal = secondHalf.reduce((sum, s) => sum + s.total, 0);

    return {
      customers: firstCustomers > 0 ? ((secondCustomers - firstCustomers) / firstCustomers) * 100 : 0,
      drivers: firstDrivers > 0 ? ((secondDrivers - firstDrivers) / firstDrivers) * 100 : 0,
      total: firstTotal > 0 ? ((secondTotal - firstTotal) / firstTotal) * 100 : 0,
    };
  }, [userRegistrationStats]);

  const orderTrends = useMemo(() => {
    if (orderStats.length < 2) return { orders: 0, revenue: 0, successRate: 0 };

    const midpoint = Math.floor(orderStats.length / 2);
    const firstHalf = orderStats.slice(0, midpoint);
    const secondHalf = orderStats.slice(midpoint);

    const firstOrders = firstHalf.reduce((sum, s) => sum + s.total, 0);
    const secondOrders = secondHalf.reduce((sum, s) => sum + s.total, 0);
    const firstRevenue = firstHalf.reduce((sum, s) => sum + s.revenue, 0);
    const secondRevenue = secondHalf.reduce((sum, s) => sum + s.revenue, 0);

    const firstCompleted = firstHalf.reduce((sum, s) => sum + s.completed, 0);
    const secondCompleted = secondHalf.reduce((sum, s) => sum + s.completed, 0);
    const firstSuccessRate = firstOrders > 0 ? (firstCompleted / firstOrders) * 100 : 0;
    const secondSuccessRate = secondOrders > 0 ? (secondCompleted / secondOrders) * 100 : 0;

    return {
      orders: firstOrders > 0 ? ((secondOrders - firstOrders) / firstOrders) * 100 : 0,
      revenue: firstRevenue > 0 ? ((secondRevenue - firstRevenue) / firstRevenue) * 100 : 0,
      successRate: secondSuccessRate - firstSuccessRate,
    };
  }, [orderStats]);

  // Prepare chart data with cumulative totals
  const userChartData = useMemo(() => {
    let cumulativeCustomers = 0;
    let cumulativeDrivers = 0;

    return userRegistrationStats.map((stat) => {
      cumulativeCustomers += stat.customers;
      cumulativeDrivers += stat.drivers;

      return {
        date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        customers: stat.customers,
        drivers: stat.drivers,
        total: stat.total,
        cumulativeCustomers,
        cumulativeDrivers,
        cumulativeTotal: cumulativeCustomers + cumulativeDrivers,
      };
    });
  }, [userRegistrationStats]);

  const orderChartData = useMemo(() => {
    let cumulativeRevenue = 0;

    return orderStats.map((stat) => {
      cumulativeRevenue += stat.revenue;
      const successRate = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;

      return {
        date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: stat.completed,
        cancelled: stat.cancelled,
        total: stat.total,
        revenue: stat.revenue,
        cumulativeRevenue,
        successRate: Math.round(successRate),
      };
    });
  }, [orderStats]);

  // Vehicle utilization pie chart data
  const vehiclePieData = useMemo(() => {
    return vehicleUtilization.map((v, index) => ({
      name: v.vehicleTypeName,
      value: v.totalOrders,
      revenue: v.totalRevenue,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6],
    }));
  }, [vehicleUtilization]);

  const TrendIndicator = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${
        isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {!isNeutral && (isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        <span>{isNeutral ? '0' : (isPositive ? '+' : '')}{value.toFixed(1)}{suffix}</span>
      </div>
    );
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const exportToCSV = async () => {
    try {
      let csvContent = '';

      // User Registration Stats
      csvContent += 'USER REGISTRATION STATISTICS\n';
      csvContent += 'Date,Customers,Drivers,Total\n';
      userRegistrationStats.forEach((stat) => {
        csvContent += `${stat.date},${stat.customers},${stat.drivers},${stat.total}\n`;
      });
      csvContent += '\n';

      // Order Statistics
      csvContent += 'ORDER STATISTICS\n';
      csvContent += 'Date,Completed,Cancelled,Total,Revenue\n';
      orderStats.forEach((stat) => {
        csvContent += `${stat.date},${stat.completed},${stat.cancelled},${stat.total},${stat.revenue}\n`;
      });
      csvContent += '\n';

      // Driver Performance
      csvContent += 'DRIVER PERFORMANCE LEADERBOARD\n';
      csvContent += 'Driver Name,Total Trips,Completed,Cancelled,Earnings,Avg Rating,Online Hours\n';
      driverPerformance.forEach((driver) => {
        csvContent += `${driver.driverName},${driver.totalTrips},${driver.completedTrips},${driver.cancelledTrips},${driver.totalEarnings},${driver.averageRating},${driver.onlineHours}\n`;
      });
      csvContent += '\n';

      // Vehicle Utilization
      csvContent += 'VEHICLE UTILIZATION\n';
      csvContent += 'Vehicle Type,Total Orders,Revenue,Utilization Rate\n';
      vehicleUtilization.forEach((vehicle) => {
        csvContent += `${vehicle.vehicleTypeName},${vehicle.totalOrders},${vehicle.totalRevenue},${vehicle.utilizationRate}\n`;
      });
      csvContent += '\n';

      // Summary Stats
      csvContent += 'SUMMARY STATISTICS\n';
      csvContent += `Total Users,${summaryStats.totalUsers}\n`;
      csvContent += `Total Customers,${summaryStats.totalCustomers}\n`;
      csvContent += `Total Drivers,${summaryStats.totalDrivers}\n`;
      csvContent += `Total Orders,${summaryStats.totalOrders}\n`;
      csvContent += `Completed Orders,${summaryStats.completedOrders}\n`;
      csvContent += `Cancelled Orders,${summaryStats.cancelledOrders}\n`;
      csvContent += `Total Revenue,${summaryStats.totalRevenue}\n`;
      csvContent += `Average Order Value,${summaryStats.averageOrderValue}\n`;

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      await alert({
        title: 'Export failed',
        message: 'Failed to export data to CSV. Please try again.',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setDateRange({
                startDate: getDefaultStartDate(),
                endDate: getDefaultEndDate(),
              });
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary Stats Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Users</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{formatNumber(summaryStats.totalUsers)}</div>
            <TrendIndicator value={userTrends.total} />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {formatNumber(summaryStats.totalCustomers)} customers, {formatNumber(summaryStats.totalDrivers)} drivers
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Orders</span>
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{formatNumber(summaryStats.totalOrders)}</div>
            <TrendIndicator value={orderTrends.orders} />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {formatNumber(summaryStats.completedOrders)} completed, {formatNumber(summaryStats.cancelledOrders)} cancelled
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalRevenue)}</div>
            <TrendIndicator value={orderTrends.revenue} />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            From {formatNumber(summaryStats.completedOrders)} completed orders
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Success Rate</span>
            <Activity className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {summaryStats.totalOrders > 0
                ? formatPercentage((summaryStats.completedOrders / summaryStats.totalOrders) * 100)
                : '0%'}
            </div>
            <TrendIndicator value={orderTrends.successRate} suffix=" pts" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Avg order value: {formatCurrency(summaryStats.averageOrderValue)}
          </div>
        </div>
      </div>

      {/* User Registration Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registration Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">User Registration Trend</h2>
                  <p className="text-sm text-gray-500">Daily new customer and driver signups</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.customers }} />
                  <span className="text-gray-600">Customers</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.drivers }} />
                  <span className="text-gray-600">Drivers</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {userChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={userChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.customers} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.customers} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDrivers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.drivers} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.drivers} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    name="Customers"
                    stroke={CHART_COLORS.customers}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCustomers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="drivers"
                    name="Drivers"
                    stroke={CHART_COLORS.drivers}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDrivers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cumulative Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Cumulative User Growth</h2>
                  <p className="text-sm text-gray-500">Total user growth over the period</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {userChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={userChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cumulativeCustomers"
                    name="Total Customers"
                    stroke={CHART_COLORS.customers}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeDrivers"
                    name="Total Drivers"
                    stroke={CHART_COLORS.drivers}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeTotal"
                    name="Total Users"
                    stroke={CHART_COLORS.total}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Order Statistics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Order Performance</h2>
                  <p className="text-sm text-gray-500">Daily completed vs cancelled orders</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.completed }} />
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.cancelled }} />
                  <span className="text-gray-600">Cancelled</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {orderChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={orderChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Bar dataKey="completed" name="Completed" fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" fill={CHART_COLORS.cancelled} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                  <p className="text-sm text-gray-500">Daily and cumulative revenue</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {orderChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={orderChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Daily Revenue"
                    stroke={CHART_COLORS.revenue}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Utilization Chart and Summary */}
      {vehicleUtilization.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Orders by Vehicle</h2>
                  <p className="text-sm text-gray-500">Distribution of orders</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={vehiclePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {vehiclePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [formatNumber(Number(value) || 0), 'Orders']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {vehiclePieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue by Vehicle Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue by Vehicle Type</h2>
                  <p className="text-sm text-gray-500">Comparing revenue across vehicle categories</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={vehiclePieData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [formatCurrency(Number(value) || 0), 'Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    radius={[0, 4, 4, 0]}
                  >
                    {vehiclePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* User Registration Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Registration Statistics</h2>
              <p className="text-sm text-gray-500">Daily breakdown of new user registrations</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customers
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drivers
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userRegistrationStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No user registration data available for this period
                  </td>
                </tr>
              ) : (
                userRegistrationStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(stat.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(stat.customers)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(stat.drivers)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatNumber(stat.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Order Statistics</h2>
              <p className="text-sm text-gray-500">Daily order performance and revenue trends</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancelled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No order data available for this period
                  </td>
                </tr>
              ) : (
                orderStats.map((stat, index) => {
                  const successRate = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(stat.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {formatNumber(stat.completed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {formatNumber(stat.cancelled)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatNumber(stat.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(stat.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          successRate >= 80 ? 'bg-green-100 text-green-800' :
                          successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(successRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Performance Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Driver Performance Leaderboard</h2>
              <p className="text-sm text-gray-500">Top performing drivers ranked by earnings</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Trips
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancelled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earnings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Online Hours
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {driverPerformance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    No driver performance data available for this period
                  </td>
                </tr>
              ) : (
                driverPerformance.map((driver, index) => {
                  const completionRate = driver.totalTrips > 0 ? (driver.completedTrips / driver.totalTrips) * 100 : 0;
                  return (
                    <tr key={driver.driverId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{driver.driverName}</div>
                        <div className="text-xs text-gray-500">
                          {formatPercentage(completionRate)} completion rate
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(driver.totalTrips)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {formatNumber(driver.completedTrips)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {formatNumber(driver.cancelledTrips)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(driver.totalEarnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-gray-900">
                            {driver.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(driver.onlineHours)}h
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Utilization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vehicle Utilization</h2>
              <p className="text-sm text-gray-500">Performance metrics by vehicle type</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Revenue/Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleUtilization.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No vehicle utilization data available for this period
                  </td>
                </tr>
              ) : (
                vehicleUtilization.map((vehicle) => {
                  const avgRevenuePerOrder = vehicle.totalOrders > 0 ? vehicle.totalRevenue / vehicle.totalOrders : 0;
                  return (
                    <tr key={vehicle.vehicleTypeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle.vehicleTypeName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatNumber(vehicle.totalOrders)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(vehicle.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(avgRevenuePerOrder)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, vehicle.utilizationRate)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {formatPercentage(vehicle.utilizationRate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
