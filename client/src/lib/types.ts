// User and Authentication Types
export interface User {
  id: string | number;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  avatar?: string;
  profilepicture?: string;
  role?: 'admin' | 'buyer' | 'seller';
  title?: string;
  bio?: string;
  location?: string;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string;
  business_name?: string;
  latitude?: number;
  longitude?: number;
  addressinfo?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    products?: string[];
  };
  shipping_fee?: number;
  seller_request?: 'pending' | 'approved' | 'rejected';
  paypal_email?: string;
  external_auth_id?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// User List Response
export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  total?: number;
  page?: number;
  limit?: number;
}

// Activity Log Types
export interface ActivityLogItem {
  id?: string;
  action: string;
  timestamp: string | number | Date;
  details?: string;
  ip_address?: string;
  user_agent?: string;
}

// IP Log Types
export interface IPLog {
  id?: string;
  ip: string;
  location?: string;
  timestamp: string | number | Date;
  user_agent?: string;
  country?: string;
  city?: string;
}

// Settings Types
export interface SettingsState {
  emailOnFollow: boolean;
  emailOnReply: boolean;
  emailOnMention: boolean;
  newLaunches: boolean;
  monthlyUpdates: boolean;
  newsletter: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

// Profile Form Types
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
}

// Admin Stats Types
export interface AdminStats {
  totalUsers: number;
  activeSessions: number;
  systemStatus: string;
  newUsersToday?: number;
  totalRevenue?: number;
  activeSellers?: number;
}

// Search and Filter Types
export interface UserSearchParams {
  query?: string;
  role?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Bulk Operations Types
export interface BulkOperation {
  userIds: string[];
  action: 'role' | 'verify' | 'delete' | 'activate' | 'deactivate';
  value?: string | boolean;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId?: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
}

// Loading States
export interface LoadingState {
  profile: boolean;
  users: boolean;
  activity: boolean;
  ipLogs: boolean;
  adminStats: boolean;
  saving: boolean;
  uploading: boolean;
}

// Pagination Types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}