'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, MapPin, User, Phone, Clock, Circle, Navigation, Eye } from 'lucide-react';
import Link from 'next/link';

interface DriverLocation {
    driverId: string;
    driverName: string;
    phone?: string;
    latitude: number;
    longitude: number;
    lastUpdate: string;
    availabilityStatus: string;
    isOnline: boolean;
    isOnTrip: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    ONLINE: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    OFFLINE: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' },
    ON_TRIP: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    BUSY: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
};

export default function LiveTrackingPage() {
    const [drivers, setDrivers] = useState<DriverLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [filter, setFilter] = useState<'all' | 'online' | 'on_trip'>('all');

    const fetchDrivers = useCallback(async () => {
        try {
            const response = await api.get('/admin/location-tracking/drivers/all');
            setDrivers(response.data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch driver locations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchDrivers, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [autoRefresh, fetchDrivers]);

    const filteredDrivers = drivers.filter(driver => {
        if (filter === 'online') return driver.isOnline;
        if (filter === 'on_trip') return driver.isOnTrip;
        return true;
    });

    const onlineCount = drivers.filter(d => d.isOnline).length;
    const onTripCount = drivers.filter(d => d.isOnTrip).length;
    const offlineCount = drivers.filter(d => !d.isOnline && !d.isOnTrip).length;

    const formatLastUpdate = (dateString: string) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Live Driver Tracking</h1>
                    <p className="text-sm text-gray-500">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Auto-refresh (30s)
                    </label>
                    <button
                        onClick={fetchDrivers}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{drivers.length}</div>
                            <div className="text-sm text-gray-500">Total Drivers</div>
                        </div>
                    </div>
                </div>
                <div
                    className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-colors ${filter === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}
                    onClick={() => setFilter(filter === 'online' ? 'all' : 'online')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Circle className="w-5 h-5 text-green-600 fill-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
                            <div className="text-sm text-gray-500">Online</div>
                        </div>
                    </div>
                </div>
                <div
                    className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-colors ${filter === 'on_trip' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                    onClick={() => setFilter(filter === 'on_trip' ? 'all' : 'on_trip')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{onTripCount}</div>
                            <div className="text-sm text-gray-500">On Trip</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Circle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-600">{offlineCount}</div>
                            <div className="text-sm text-gray-500">Offline</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map View */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Map View</h2>
                    </div>
                    <div className="h-96 bg-gray-100">
                        {filteredDrivers.length > 0 ? (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&center=${
                                    selectedDriver
                                        ? `${selectedDriver.latitude},${selectedDriver.longitude}`
                                        : filteredDrivers.length > 0
                                            ? `${filteredDrivers[0].latitude},${filteredDrivers[0].longitude}`
                                            : '6.5244,3.3792'
                                }&zoom=12`}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <MapPin className="w-12 h-12 text-gray-300" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Driver List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-900">
                            Drivers {filter !== 'all' && `(${filter === 'online' ? 'Online' : 'On Trip'})`}
                        </h2>
                        {filter !== 'all' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                Show All
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {filteredDrivers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p>No drivers found</p>
                            </div>
                        ) : (
                            filteredDrivers.map((driver) => {
                                const statusStyle = STATUS_COLORS[driver.availabilityStatus] || STATUS_COLORS.OFFLINE;
                                const isSelected = selectedDriver?.driverId === driver.driverId;

                                return (
                                    <div
                                        key={driver.driverId}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                            isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                                        }`}
                                        onClick={() => setSelectedDriver(isSelected ? null : driver)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <span className="text-indigo-600 font-semibold">
                                                            {driver.driverName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusStyle.dot}`} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{driver.driverName}</div>
                                                    {driver.phone && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Phone className="w-3 h-3" />
                                                            {driver.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {driver.availabilityStatus.replace('_', ' ')}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatLastUpdate(driver.lastUpdate)}
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="text-gray-500">
                                                        <MapPin className="w-4 h-4 inline mr-1" />
                                                        {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a
                                                            href={`https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Open Maps
                                                        </a>
                                                        <Link
                                                            href={`/dashboard/drivers/${driver.driverId}`}
                                                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 flex items-center gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            Profile
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
