'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Order, OrderStatus, OrderType } from '@/lib/types';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { useDialog } from '@/components/ui/action-dialog';
import {
  Package,
  MapPin,
  User,
  Wallet,
  Route,
  Truck,
  UserRound,
  Car,
} from 'lucide-react';

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
    const badges: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CREATED]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.DRIVER_ASSIGNED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.ACCEPTED]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.EN_ROUTE_TO_PICKUP]: 'bg-purple-100 text-purple-800',
      [OrderStatus.ARRIVED_AT_PICKUP]: 'bg-orange-100 text-orange-800',
      [OrderStatus.PICKED_UP]: 'bg-teal-100 text-teal-800',
      [OrderStatus.STARTED]: 'bg-green-100 text-green-800',
      [OrderStatus.EN_ROUTE_TO_DROPOFF]: 'bg-teal-100 text-teal-800',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [OrderStatus.FAILED]: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // The price actually shown on an order. Decimal fields come back as strings
  // from the API; `total`/`subtotal` are the real columns, with the legacy
  // `finalPrice`/`estimatedPrice` kept as fallbacks.
  const orderPrice = (order: Order) =>
    order.total ?? order.subtotal ?? order.finalPrice ?? order.estimatedPrice;

  const orderDistance = (order: Order) =>
    order.estimatedDistance ?? order.actualDistance ?? order.distance;

  // Classify each order as a passenger trip or goods delivery for the badge.
  const isPassengerOrder = (order: Order) =>
    order.orderType === OrderType.PASSENGER ||
    order.orderType === OrderType.MOVE_TRANSPORT;

  const tripTypeMeta = (order: Order) =>
    isPassengerOrder(order)
      ? {
          label: 'Passenger Trip',
          className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
          Icon: UserRound,
        }
      : {
          label: 'Goods Delivery',
          className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
          Icon: Package,
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
        {orders.map((order) => {
          const trip = tripTypeMeta(order);
          const TripIcon = trip.Icon;
          return (
            <div
              key={order.id}
              className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
              onClick={() => viewOrderDetails(order.id)}
            >
              {/* Trip-type accent bar */}
              <div
                className={`h-1 w-full ${
                  isPassengerOrder(order) ? 'bg-sky-500' : 'bg-amber-500'
                }`}
              />

              <div className="p-6">
                {/* Header: trip type + status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${trip.className}`}
                    >
                      <TripIcon className="w-3.5 h-3.5" />
                      {trip.label}
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-gray-900 truncate">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* People */}
                <div className="space-y-3">
                  <div className="flex items-start text-sm">
                    <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                      <p className="text-gray-500 truncate">
                        {order.customer?.phoneNumber}
                      </p>
                    </div>
                  </div>

                  {order.driver ? (
                    <div className="flex items-start text-sm">
                      <Car className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          Driver: {order.driver.firstName} {order.driver.lastName}
                        </p>
                        <p className="text-gray-500 truncate">
                          {order.driver.phoneNumber}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-400">
                      <Car className="w-4 h-4 mr-2 shrink-0" />
                      <span className="italic">No driver assigned</span>
                    </div>
                  )}
                </div>

                {/* Route */}
                <div className="mt-4 rounded-lg bg-gray-50 p-3 space-y-2">
                  <div className="flex items-start text-sm">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-500 shrink-0" />
                    <p className="text-gray-700 truncate">{order.pickupAddress}</p>
                  </div>
                  <div className="flex items-start text-sm">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-red-500 shrink-0" />
                    <p className="text-gray-700 truncate">
                      {order.destinationAddress}
                    </p>
                  </div>
                </div>

                {/* Footer: price + distance */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <div className="flex items-center text-base font-semibold text-gray-900">
                    <Wallet className="w-4 h-4 mr-1.5 text-indigo-500" />
                    {formatCurrency(orderPrice(order), order.currency)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Route className="w-4 h-4 mr-1.5 text-gray-400" />
                    {formatNumber(orderDistance(order))} km
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
                      {selectedOrder.vehicleTypeEntity?.name ||
                        selectedOrder.vehicleType?.name ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Type</label>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                      tripTypeMeta(selectedOrder).className
                    }`}
                  >
                    {isPassengerOrder(selectedOrder) ? 'Passenger Trip' : 'Goods Delivery'}
                  </span>
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
                    <p className="mt-1 text-sm text-gray-900">{formatNumber(orderDistance(selectedOrder))} km</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(
                        selectedOrder.subtotal ?? selectedOrder.estimatedPrice,
                        selectedOrder.currency,
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total</label>
                    <p className="mt-1 text-sm font-bold text-green-600">
                      {formatCurrency(orderPrice(selectedOrder), selectedOrder.currency)}
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
