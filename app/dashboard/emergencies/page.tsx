'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle, Clock, Eye, RefreshCw } from 'lucide-react';

interface Emergency {
    id: string;
    type: string;
    status: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    userRole: string;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
    };
}

interface EmergencyStats {
    reported: number;
    acknowledged: number;
    responding: number;
    resolved: number;
    falseAlarm: number;
    active: number;
    total: number;
}

const STATUS_COLORS: Record<string, string> = {
    REPORTED: 'bg-red-100 text-red-800',
    ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
    RESPONDING: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
    FALSE_ALARM: 'bg-gray-100 text-gray-800',
};

const TYPE_ICONS: Record<string, string> = {
    ACCIDENT: '🚗',
    VEHICLE_BREAKDOWN: '🔧',
    MEDICAL: '🏥',
    SECURITY_THREAT: '⚠️',
    HARASSMENT: '🚨',
    ROBBERY: '💰',
    OTHER: '❓',
};

export default function EmergenciesPage() {
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);
    const [stats, setStats] = useState<EmergencyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, [page, statusFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [emergenciesRes, statsRes] = await Promise.all([
                api.get('/admin/emergencies', { params: { page, limit: 20, status: statusFilter || undefined } }),
                api.get('/admin/emergencies/stats'),
            ]);
            setEmergencies(emergenciesRes.data.data);
            setTotalPages(emergenciesRes.data.meta.totalPages);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch emergencies:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.patch(`/admin/emergencies/${id}`, { status });
            fetchData();
        } catch (err) {
            console.error('Failed to update emergency:', err);
        }
    };

    if (loading && emergencies.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">🚨 Emergency Reports</h1>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{stats.active}</div>
                        <div className="text-sm text-red-700">Active</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{stats.reported}</div>
                        <div className="text-sm text-red-700">Reported</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</div>
                        <div className="text-sm text-yellow-700">Acknowledged</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{stats.responding}</div>
                        <div className="text-sm text-blue-700">Responding</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                        <div className="text-sm text-green-700">Resolved</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-2xl font-bold text-gray-600">{stats.falseAlarm}</div>
                        <div className="text-sm text-gray-700">False Alarm</div>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                        <div className="text-sm text-indigo-700">Total</div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                        <option value="">All Statuses</option>
                        <option value="REPORTED">Reported</option>
                        <option value="ACKNOWLEDGED">Acknowledged</option>
                        <option value="RESPONDING">Responding</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="FALSE_ALARM">False Alarm</option>
                    </select>
                </div>
            </div>

            {/* Emergencies List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {emergencies.map((emergency) => (
                                <tr key={emergency.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{TYPE_ICONS[emergency.type] || '❓'}</span>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {emergency.type.replace('_', ' ')}
                                                </div>
                                                <div className="text-xs text-gray-500">{emergency.userRole}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {emergency.user?.name || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-gray-500">{emergency.user?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {emergency.latitude && emergency.longitude ? (
                                            <a
                                                href={`https://maps.google.com/?q=${emergency.latitude},${emergency.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                📍 View on Map
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-sm">No location</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[emergency.status]}`}
                                        >
                                            {emergency.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(emergency.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/emergencies/${emergency.id}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            {emergency.status === 'REPORTED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(emergency.id, 'ACKNOWLEDGED')}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Acknowledge"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(emergency.status === 'REPORTED' || emergency.status === 'ACKNOWLEDGED') && (
                                                <button
                                                    onClick={() => handleStatusUpdate(emergency.id, 'RESPONDING')}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Mark as Responding"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {emergency.status !== 'RESOLVED' && emergency.status !== 'FALSE_ALARM' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(emergency.id, 'RESOLVED')}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Mark as Resolved"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
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
                            disabled={page <= 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || emergencies.length === 0}
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
