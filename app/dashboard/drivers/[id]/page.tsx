'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { User, VerificationStatus } from '@/lib/types';
import { useDialog } from '@/components/ui/action-dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  ShieldX,
  MapPin,
  Activity,
  FileText,
  Truck,
  UserCircle,
} from 'lucide-react';

export default function DriverDetailsPage() {
  const params = useParams();
  const driverId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [driver, setDriver] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { alert } = useDialog();

  useEffect(() => {
    if (!driverId) return;

    const loadDriver = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUserById(driverId);
        setDriver(response.data);
      } catch (err: any) {
        await alert({
          title: 'Driver not found',
          message: err.response?.data?.message || 'Failed to load driver details.',
          intent: 'danger',
          confirmText: 'Retry',
          cancelText: 'Close',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [driverId, alert]);

  const getStatusBadge = (status?: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return 'bg-green-100 text-green-800';
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case VerificationStatus.PENDING:
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading && !driver) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-600">No driver data available.</p>
      </div>
    );
  }

  const profile = driver.driverProfile;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/drivers"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to drivers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Driver Details</h1>
        </div>
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
            profile?.verificationStatus
          )}`}
        >
          {profile?.verificationStatus || 'PENDING'}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <UserCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {driver.firstName} {driver.lastName}
            </h2>
            <p className="text-sm text-gray-500">{driver.email}</p>
          </div>
          <div className="ml-auto">
            {profile?.isOnline ? (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Online
              </span>
            ) : (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{driver.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{driver.phoneNumber || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{driver.country || 'Location not set'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Verification</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Email verified</span>
            {driver.isEmailVerified ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : (
              <ShieldX className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Phone verified</span>
            {driver.isPhoneVerified ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : (
              <ShieldX className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>License number</span>
            <span className="font-medium text-gray-900">{profile?.licenseNumber || 'N/A'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Activity className="w-4 h-4 text-gray-400" />
            <span>{profile?.isOnline ? 'Currently online' : 'Currently offline'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Truck className="w-4 h-4 text-gray-400" />
            <span>{profile?.vehicle?.name || 'Vehicle not assigned'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>
              {profile?.lastKnownLatitude && profile?.lastKnownLongitude
                ? `${profile.lastKnownLatitude}, ${profile.lastKnownLongitude}`
                : 'Last location unavailable'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <DocumentCard
            title="Driver's License"
            url={profile?.licenseUrl}
          />
          <DocumentCard
            title="Vehicle Registration"
            url={profile?.vehicleRegistrationUrl}
          />
          <DocumentCard
            title="Insurance"
            url={profile?.insuranceUrl}
          />
        </div>
        {profile?.rejectionReason && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Rejection reason</p>
            <p className="mt-1">{profile.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ title, url }: { title: string; url?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          <FileText className="w-4 h-4 mr-1" />
          View document
        </a>
      ) : (
        <p className="mt-2 text-xs text-gray-400">No document uploaded</p>
      )}
    </div>
  );
}
