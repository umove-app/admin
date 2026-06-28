export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  ADMIN_SUPERVISOR = 'ADMIN_SUPERVISOR',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  CREATED = 'CREATED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  ARRIVED_AT_PICKUP = 'ARRIVED_AT_PICKUP',
  PICKED_UP = 'PICKED_UP',
  STARTED = 'STARTED',
  EN_ROUTE_TO_DROPOFF = 'EN_ROUTE_TO_DROPOFF',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum OrderType {
  MOVE_TRANSPORT = 'MOVE_TRANSPORT',
  PARCEL_DELIVERY = 'PARCEL_DELIVERY',
  PASSENGER = 'PASSENGER',
  GOODS = 'GOODS',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  STRIPE = 'STRIPE',
}

export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  activeDrivers: number;
  pendingDriverVerifications: number;
  todayOrders: number;
  todayRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profilePictureUrl?: string;
  createdAt: string;
  status?: string;
  country?: string;
  lastLoginAt?: string;
  driverProfile?: DriverProfile;
}

export interface DriverProfile {
  userId: string;
  licenseNumber: string;
  licenseUrl: string;
  vehicleRegistrationUrl: string;
  insuranceUrl: string;
  verificationStatus: VerificationStatus;
  isOnline: boolean;
  lastKnownLatitude?: number;
  lastKnownLongitude?: number;
  lastLocationUpdate?: string;
  rejectionReason?: string;
  vehicle?: VehicleType;
}

export interface Order {
  id: string;
  customerId: string;
  driverId?: string;
  vehicleTypeId: string;
  orderType: OrderType;
  status: OrderStatus;
  pickupAddress: string;
  pickupLatitude: number | string;
  pickupLongitude: number | string;
  destinationAddress: string;
  destinationLatitude: number | string;
  destinationLongitude: number | string;
  // Decimal columns are serialized as strings by the API.
  distance?: number | string;
  estimatedDistance?: number | string;
  actualDistance?: number | string;
  // Pricing — `subtotal` and `total` are the real API fields.
  subtotal?: number | string;
  vat?: number | string;
  discount?: number | string;
  total?: number | string;
  currency?: string;
  // Legacy aliases kept for back-compat with older API shapes.
  estimatedPrice?: number | string;
  finalPrice?: number | string;
  pickupTime?: string;
  recipientName?: string;
  recipientPhone?: string;
  itemDescription?: string;
  specialInstructions?: string;
  promoCode?: string;
  discountAmount?: number | string;
  createdAt: string;
  customer?: User;
  driver?: User;
  vehicleType?: VehicleType;
  vehicleTypeEntity?: VehicleType;
  payment?: Payment;
  review?: Review;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface VehicleType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number | string;
  pricePerKm: number | string;
  imageUrl?: string;
  isActive: boolean;
  availableCountries?: string[];
}

export interface Promo {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  maxUsageCount?: number;
  currentUsageCount: number;
  maxUsagePerUser?: number;
  startDate?: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  driverId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface UserRegistrationStats {
  date: string;
  customers: number;
  drivers: number;
  total: number;
}

export interface PaymentStats {
  date?: string;
  amount?: number;
  count?: number;
  provider?: string;
  totalRevenue?: number;
  totalTransactions?: number;
  paystackRevenue?: number;
  stripeRevenue?: number;
  previousTotalRevenue?: number;
  previousTotalTransactions?: number;
  previousPaystackRevenue?: number;
  previousStripeRevenue?: number;
}

export interface OrderStats {
  date: string;
  completed: number;
  cancelled: number;
  total: number;
  revenue: number;
}

export interface DriverPerformance {
  driverId: string;
  driverName: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
  averageRating: number;
  onlineHours: number;
}

export interface VehicleUtilization {
  vehicleTypeId: string;
  vehicleTypeName: string;
  totalOrders: number;
  totalRevenue: number;
  utilizationRate: number;
}

export interface ActiveDriver {
  driverId: string;
  driverName: string;
  phoneNumber: string;
  vehicleType: string;
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string;
}
