'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    MessageSquare,
    Navigation,
} from 'lucide-react';

interface Emergency {
    id: string;
    type: string;
    status: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    userRole: string;
    orderId?: string;
    platform?: string;
    adminNotes?: string;
    createdAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        phone?: string;
        email?: string;
    };
    handledByAdmin?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

const STATUS_COLORS: Record<string, string> = {
    REPORTED: 'bg-red-100 text-red-800 border-red-200',
    ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESPONDING: 'bg-blue-100 text-blue-800 border-blue-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    FALSE_ALARM: 'bg-gray-100 text-gray-800 border-gray-200',
};

const TYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
    ACCIDENT: { icon: '🚗', label: 'Accident', color: 'bg-red-500' },
    VEHICLE_BREAKDOWN: { icon: '🔧', label: 'Vehicle Breakdown', color: 'bg-orange-500' },
    MEDICAL: { icon: '🏥', label: 'Medical Emergency', color: 'bg-pink-500' },
    SECURITY_THREAT: { icon: '⚠️', label: 'Security Threat', color: 'bg-yellow-500' },
    HARASSMENT: { icon: '🚨', label: 'Harassment', color: 'bg-purple-500' },
    ROBBERY: { icon: '💰', label: 'Robbery', color: 'bg-red-600' },
    OTHER: { icon: '❓', label: 'Other', color: 'bg-gray-500' },
};

export default function EmergencyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [emergency, setEmergency] = useState<Emergency | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [showNotesForm, setShowNotesForm] = useState(false);

    useEffect(() => {
        fetchEmergency();
    }, [params.id]);

    const fetchEmergency = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/emergencies/${params.id}`);
            setEmergency(response.data);
            setAdminNotes(response.data.adminNotes || '');
        } catch (err) {
            console.error('Failed to fetch emergency:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if (!emergency) return;

        try {
            setUpdating(true);
            await api.patch(`/admin/emergencies/${emergency.id}`, { status });
            fetchEmergency();
        } catch (err) {
            console.error('Failed to update emergency:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleNotesUpdate = async () => {
        if (!emergency) return;

        try {
            setUpdating(true);
            await api.patch(`/admin/emergencies/${emergency.id}`, { adminNotes });
            setShowNotesForm(false);
            fetchEmergency();
        } catch (err) {
            console.error('Failed to update notes:', err);
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    const getTimeSince = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ago`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
        return `${minutes}m ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!emergency) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-lg font-medium text-gray-900">Emergency not found</h2>
                <Link href="/dashboard/emergencies" className="text-indigo-600 hover:underline mt-2 inline-block">
                    Back to Emergencies
                </Link>
            </div>
        );
    }

    const typeInfo = TYPE_INFO[emergency.type] || TYPE_INFO.OTHER;
    const userName = emergency.user
        ? `${emergency.user.firstName} ${emergency.user.lastName}`
        : 'Unknown User';
    const userPhone = emergency.user?.phoneNumber || emergency.user?.phone;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-3xl">{typeInfo.icon}</span>
                            {typeInfo.label}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Reported {getTimeSince(emergency.createdAt)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchEmergency}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-4 border-2 ${STATUS_COLORS[emergency.status]}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold">{emergency.status.replace('_', ' ')}</div>
                    </div>
                    {emergency.status !== 'RESOLVED' && emergency.status !== 'FALSE_ALARM' && (
                        <div className="flex gap-2">
                            {emergency.status === 'REPORTED' && (
                                <button
                                    onClick={() => handleStatusUpdate('ACKNOWLEDGED')}
                                    disabled={updating}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                                >
                                    Acknowledge
                                </button>
                            )}
                            {(emergency.status === 'REPORTED' || emergency.status === 'ACKNOWLEDGED') && (
                                <button
                                    onClick={() => handleStatusUpdate('RESPONDING')}
                                    disabled={updating}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                >
                                    Start Response
                                </button>
                            )}
                            <button
                                onClick={() => handleStatusUpdate('RESOLVED')}
                                disabled={updating}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Resolve
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('FALSE_ALARM')}
                                disabled={updating}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                            >
                                <XCircle className="w-4 h-4 inline mr-1" />
                                False Alarm
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        User Information
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-bold text-lg">
                                    {emergency.user?.firstName?.[0] || 'U'}
                                </span>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{userName}</div>
                                <div className="text-sm text-gray-500 capitalize">
                                    {emergency.userRole?.toLowerCase() || 'User'}
                                </div>
                            </div>
                        </div>
                        {userPhone && (
                            <div className="flex items-center gap-3 text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <a
                                    href={`tel:${userPhone}`}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {userPhone}
                                </a>
                            </div>
                        )}
                        {emergency.user?.email && (
                            <div className="flex items-center gap-3 text-gray-700">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a
                                    href={`mailto:${emergency.user.email}`}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {emergency.user.email}
                                </a>
                            </div>
                        )}
                        {emergency.user?.id && (
                            <Link
                                href={`/dashboard/users/${emergency.user.id}`}
                                className="inline-block mt-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                            >
                                View User Profile
                            </Link>
                        )}
                    </div>
                </div>

                {/* Location Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Location
                    </h2>
                    {emergency.latitude && emergency.longitude ? (
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${emergency.latitude},${emergency.longitude}&zoom=15`}
                                />
                            </div>
                            <div className="text-sm text-gray-600">
                                <strong>Coordinates:</strong> {emergency.latitude.toFixed(6)}, {emergency.longitude.toFixed(6)}
                            </div>
                            {emergency.address && (
                                <div className="text-sm text-gray-600">
                                    <strong>Address:</strong> {emergency.address}
                                </div>
                            )}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${emergency.latitude},${emergency.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Navigation className="w-4 h-4" />
                                Get Directions
                            </a>
                        </div>
                    ) : (
                        <div className="text-gray-500 py-8 text-center">
                            <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            No location data available
                        </div>
                    )}
                </div>
            </div>

            {/* Emergency Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Emergency Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Type</div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                            <span>{typeInfo.icon}</span>
                            {typeInfo.label}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Platform</div>
                        <div className="font-medium text-gray-900 capitalize">
                            {emergency.platform || 'Unknown'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Reported At</div>
                        <div className="font-medium text-gray-900">
                            {formatDate(emergency.createdAt)}
                        </div>
                    </div>
                    {emergency.acknowledgedAt && (
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Acknowledged At</div>
                            <div className="font-medium text-gray-900">
                                {formatDate(emergency.acknowledgedAt)}
                            </div>
                        </div>
                    )}
                    {emergency.resolvedAt && (
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Resolved At</div>
                            <div className="font-medium text-gray-900">
                                {formatDate(emergency.resolvedAt)}
                            </div>
                        </div>
                    )}
                    {emergency.orderId && (
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Related Order</div>
                            <Link
                                href={`/dashboard/orders?id=${emergency.orderId}`}
                                className="text-indigo-600 hover:underline font-medium"
                            >
                                View Order
                            </Link>
                        </div>
                    )}
                </div>
                {emergency.description && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Description</div>
                        <div className="text-gray-900">{emergency.description}</div>
                    </div>
                )}
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Admin Notes
                    </span>
                    {!showNotesForm && (
                        <button
                            onClick={() => setShowNotesForm(true)}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            {emergency.adminNotes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                    )}
                </h2>
                {showNotesForm ? (
                    <div className="space-y-4">
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes about this emergency..."
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleNotesUpdate}
                                disabled={updating}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                Save Notes
                            </button>
                            <button
                                onClick={() => {
                                    setShowNotesForm(false);
                                    setAdminNotes(emergency.adminNotes || '');
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : emergency.adminNotes ? (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-gray-900 whitespace-pre-wrap">{emergency.adminNotes}</p>
                        {emergency.handledByAdmin && (
                            <p className="mt-2 text-sm text-gray-500">
                                By {emergency.handledByAdmin.firstName} {emergency.handledByAdmin.lastName}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-500 py-4 text-center">
                        No admin notes yet
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Timeline
                </h2>
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-6">
                        <div className="relative flex items-start gap-4">
                            <div className="relative z-10 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Emergency Reported</div>
                                <div className="text-sm text-gray-500">{formatDate(emergency.createdAt)}</div>
                            </div>
                        </div>
                        {emergency.acknowledgedAt && (
                            <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">Acknowledged</div>
                                    <div className="text-sm text-gray-500">{formatDate(emergency.acknowledgedAt)}</div>
                                </div>
                            </div>
                        )}
                        {emergency.resolvedAt && (
                            <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {emergency.status === 'FALSE_ALARM' ? 'Marked as False Alarm' : 'Resolved'}
                                    </div>
                                    <div className="text-sm text-gray-500">{formatDate(emergency.resolvedAt)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
