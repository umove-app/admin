'use client';

/**
 * Admin Driver Verification Details Page
 * View driver documents and vehicles, approve/reject verification
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { driverApi } from '@/lib/api';

interface Document {
    id: string;
    documentType: string;
    documentUrl: string;
    documentNumber?: string;
    expiryDate?: string;
    verified: boolean;
    createdAt: string;
}

interface Vehicle {
    id: string;
    type: string;
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    photos: string[];
    verified: boolean;
    registrationDocument?: string;
    insuranceDocument?: string;
}

interface DriverDetails {
    id: string;
    name: string;
    email: string;
    phone: string;
    documents?: Document[];
    vehicles?: Vehicle[];
    driverProfile?: {
        userId: string;
        kycStatus: string;
        verificationStatus: string;
        licenseNumber?: string;
        rejectionReason?: string;
    };
}

export default function VerificationDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const driverId = params?.id as string;

    const [driver, setDriver] = useState<DriverDetails | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (driverId) {
            fetchDriverDetails();
        }
    }, [driverId]);

    const fetchDriverDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await driverApi.getDriverById(driverId);
            const driverData: DriverDetails = response.data;
            setDriver(driverData);

            // Extract documents and vehicles from the driver data
            setDocuments(driverData.documents || []);
            setVehicles(driverData.vehicles || []);
        } catch (err: any) {
            console.error('Fetch driver error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch driver');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await driverApi.verifyDriver(driverId);
            alert('Driver approved successfully!');
            fetchDriverDetails();
        } catch (err: any) {
            console.error('Approve error:', err);
            alert(err.response?.data?.message || err.message || 'Failed to approve driver');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            await driverApi.rejectDriver(driverId, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            alert('Driver rejected successfully!');
            fetchDriverDetails();
        } catch (err: any) {
            console.error('Reject error:', err);
            alert(err.response?.data?.message || err.message || 'Failed to reject driver');
        } finally {
            setActionLoading(false);
        }
    };

    const getDocumentLabel = (type: string) => {
        const labels: Record<string, string> = {
            DRIVERS_LICENSE: "Driver's License",
            NATIONAL_ID: 'National ID',
            VEHICLE_REGISTRATION: 'Vehicle Registration',
            VEHICLE_INSURANCE: 'Vehicle Insurance',
            PASSPORT: 'Passport',
            PROOF_OF_ADDRESS: 'Proof of Address',
        };
        return labels[type] || type;
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDING':
            case 'UNDER_REVIEW':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'VERIFIED':
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !driver) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error || 'Driver not found'}
                </div>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    ← Back to list
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
                    >
                        ← Back to Verification
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Driver Verification</h1>
                    <p className="text-gray-600 mt-1">{driver.name}</p>
                </div>
                <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(driver.driverProfile?.verificationStatus || 'PENDING')}`}>
                    {driver.driverProfile?.verificationStatus || 'PENDING'}
                </span>
            </div>

            {/* Driver Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <p className="font-medium">{driver.name}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="font-medium">{driver.email}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="font-medium">{driver.phone}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">License Number</label>
                        <p className="font-medium">{driver.driverProfile?.licenseNumber || 'Not provided'}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">KYC Status</label>
                        <p className="font-medium">{driver.driverProfile?.kycStatus || 'N/A'}</p>
                    </div>
                </div>
                {driver.driverProfile?.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <label className="text-sm text-red-600 font-medium">Previous Rejection Reason</label>
                        <p className="text-red-700">{driver.driverProfile.rejectionReason}</p>
                    </div>
                )}
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h2>
                {documents.length === 0 ? (
                    <p className="text-gray-500">No documents have been submitted yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => setSelectedImage(doc.documentUrl)}
                            >
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                                    <img
                                        src={doc.documentUrl}
                                        alt={getDocumentLabel(doc.documentType)}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="font-medium text-gray-900">{getDocumentLabel(doc.documentType)}</h3>
                                {doc.documentNumber && (
                                    <p className="text-sm text-gray-600">#{doc.documentNumber}</p>
                                )}
                                {doc.expiryDate && (
                                    <p className="text-sm text-gray-500">
                                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                    </p>
                                )}
                                <div className="mt-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${doc.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {doc.verified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Vehicles Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Registered Vehicles</h2>
                {vehicles.length === 0 ? (
                    <p className="text-gray-500">No vehicles have been registered yet.</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-4">
                                    {vehicle.photos && vehicle.photos.length > 0 && (
                                        <div
                                            className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                                            onClick={() => setSelectedImage(vehicle.photos[0])}
                                        >
                                            <img
                                                src={vehicle.photos[0]}
                                                alt={`${vehicle.make} ${vehicle.model}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {vehicle.make} {vehicle.model} ({vehicle.year})
                                        </h3>
                                        <p className="text-gray-600">{vehicle.type} • {vehicle.color}</p>
                                        <p className="text-gray-500 text-sm">Plate: {vehicle.plateNumber}</p>
                                        <div className="mt-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${vehicle.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {vehicle.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {vehicle.photos && vehicle.photos.length > 1 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto">
                                        {vehicle.photos.slice(1).map((photo, idx) => (
                                            <img
                                                key={idx}
                                                src={photo}
                                                alt={`Vehicle photo ${idx + 2}`}
                                                className="w-16 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                                                onClick={() => setSelectedImage(photo)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {driver.driverProfile?.verificationStatus !== 'VERIFIED' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Actions</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                        >
                            {actionLoading ? 'Processing...' : '✓ Approve Driver'}
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                        >
                            ✕ Reject Driver
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Driver</h3>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for rejection. This will be shared with the driver.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
                        onClick={() => setSelectedImage(null)}
                    >
                        ✕
                    </button>
                    <img
                        src={selectedImage}
                        alt="Document preview"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
}
