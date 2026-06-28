'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { useDialog } from '@/components/ui/action-dialog';
import { Package, MapPin, User, DollarSign } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { alert } = useDialog();

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllOrders(
        page,
        20,
        statusFilter as OrderStatus
      );
      setOrders(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await adminApi.getOrderById(orderId);
      setSelectedOrder(response.data);
      setShowModal(true);
    } catch (err: any) {
      await alert({
        title: 'Order details unavailable',
        message: 'Failed to load order details. Please try again.',
        intent: 'danger',
        confirmText: 'Retry',
        cancelText: 'Close',
      });
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const badges = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.ACCEPTED]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.EN_ROUTE_TO_PICKUP]: 'bg-purple-100 text-purple-800',
      [OrderStatus.ARRIVED_AT_PICKUP]: 'bg-orange-100 text-orange-800',
      [OrderStatus.STARTED]: 'bg-green-100 text-green-800',
      [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [OrderStatus.FAILED]: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <span className="text-sm text-gray-500">Auto-refreshing every 30s</span>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value={OrderStatus.PENDING}>Pending</option>
            <option value={OrderStatus.ASSIGNED}>Assigned</option>
            <option value={OrderStatus.ACCEPTED}>Accepted</option>
            <option value={OrderStatus.EN_ROUTE_TO_PICKUP}>En Route to Pickup</option>
            <option value={OrderStatus.ARRIVED_AT_PICKUP}>Arrived at Pickup</option>
            <option value={OrderStatus.STARTED}>In Progress</option>
            <option value={OrderStatus.COMPLETED}>Completed</option>
            <option value={OrderStatus.CANCELLED}>Cancelled</option>
            <option value={OrderStatus.FAILED}>Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => viewOrderDetails(order.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{order.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start text-sm">
                <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p className="text-gray-500">{order.customer?.phoneNumber}</p>
                </div>
              </div>

              {order.driver && (
                <div className="flex items-start text-sm">
                  <Package className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Driver: {order.driver.firstName} {order.driver.lastName}
                    </p>
                    <p className="text-gray-500">{order.driver.phoneNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start text-sm">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                <div>
                  <p className="text-gray-600">From: {order.pickupAddress}</p>
                </div>
              </div>

              <div className="flex items-start text-sm">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-red-500" />
                <div>
                  <p className="text-gray-600">To: {order.destinationAddress}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formatCurrency(order.finalPrice || order.estimatedPrice)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(order.estimatedDistance ?? order.distance)} km
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg max-w-3xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details - #{selectedOrder.id.slice(0, 8)}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-flex mt-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedOrder.vehicleType?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer?.phoneNumber}</p>
                </div>

                {selectedOrder.driver && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Driver</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedOrder.driver.firstName} {selectedOrder.driver.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedOrder.driver.phoneNumber}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.pickupAddress}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.destinationAddress}</p>
                </div>

                {selectedOrder.recipientName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedOrder.recipientName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipient Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedOrder.recipientPhone}</p>
                    </div>
                  </div>
                )}

                {selectedOrder.itemDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.itemDescription}</p>
                  </div>
                )}

                {selectedOrder.specialInstructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.specialInstructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Distance</label>
                    <p className="mt-1 text-sm text-gray-900">{formatNumber(selectedOrder.estimatedDistance ?? selectedOrder.distance)} km</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Price</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(selectedOrder.estimatedPrice)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Final Price</label>
                    <p className="mt-1 text-sm font-bold text-green-600">
                      {formatCurrency(selectedOrder.finalPrice || selectedOrder.estimatedPrice)}
                    </p>
                  </div>
                </div>

                {selectedOrder.payment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Information</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Provider</p>
                        <p className="font-medium">{selectedOrder.payment.provider}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-medium">{selectedOrder.payment.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reference</p>
                        <p className="font-medium">{selectedOrder.payment.reference}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
