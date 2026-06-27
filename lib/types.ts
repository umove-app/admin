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
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  ARRIVED_AT_PICKUP = 'ARRIVED_AT_PICKUP',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
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
  status: OrderStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  distance: number;
  estimatedPrice: number;
  finalPrice?: number;
  pickupTime?: string;
  recipientName?: string;
  recipientPhone?: string;
  itemDescription?: string;
  specialInstructions?: string;
  promoCode?: string;
  discountAmount?: number;
  createdAt: string;
  customer?: User;
  driver?: User;
  vehicleType?: VehicleType;
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
  basePrice: number;
  pricePerKm: number;
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
