'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import {
  Users,
  Car,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getDashboardStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Total Drivers',
      value: stats?.totalDrivers || 0,
      icon: Car,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'positive',
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
      changeType: 'positive',
    },
  ];

  const activityCards = [
    {
      name: 'Active Orders',
      value: stats?.activeOrders || 0,
      icon: Activity,
      color: 'bg-orange-500',
    },
    {
      name: 'Active Drivers',
      value: stats?.activeDrivers || 0,
      icon: Car,
      color: 'bg-teal-500',
    },
    {
      name: 'Pending Verifications',
      value: stats?.pendingDriverVerifications || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  const periodStats = [
    {
      period: 'Today',
      orders: stats?.todayOrders || 0,
      revenue: formatCurrency(stats?.todayRevenue || 0),
    },
    {
      period: 'This Month',
      orders: stats?.monthlyOrders || 0,
      revenue: formatCurrency(stats?.monthlyRevenue || 0),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                {/* <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">{card.change}</span>
                  <span className="text-gray-500 ml-2">from last month</span>
                </div> */}
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {activityCards.map((card) => (
          <div
            key={card.name}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {periodStats.map((stat) => (
          <div
            key={stat.period}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{stat.period}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Orders</span>
                <span className="text-lg font-bold text-gray-900">{stat.orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Revenue</span>
                <span className="text-lg font-bold text-green-600">{stat.revenue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/dashboard/drivers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Verify Drivers</p>
              <p className="text-xs text-gray-500">{stats?.pendingDriverVerifications} pending</p>
            </div>
          </a>
          <a
            href="/dashboard/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-5 h-5 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Active Orders</p>
              <p className="text-xs text-gray-500">{stats?.activeOrders} in progress</p>
            </div>
          </a>
          <a
            href="/dashboard/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manage Users</p>
              <p className="text-xs text-gray-500">{stats?.totalUsers} total</p>
            </div>
          </a>
          <a
            href="/dashboard/analytics"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
              <p className="text-xs text-gray-500">Detailed insights</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
