import { apiUrl, getJson, postJson, putJson, deleteJson } from './api';
import type { 
  User, 
  ApiResponse, 
  UserListResponse, 
  ActivityLogItem, 
  IPLog, 
  AdminStats,
  UserSearchParams,
  BulkOperation,
  ProfileFormData
} from './types';

// User API Service
export class UserApiService {
  // Get current user profile
  static async getCurrentUser(): Promise<User> {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      throw new Error('No user data available');
    }
    try {
      const userData = JSON.parse(savedUser);
      return transformUserData(userData);
    } catch (error) {
      throw new Error('Invalid user data in localStorage');
    }
  }

  // Get user by ID
  static async getUserById(userId: string | number): Promise<User> {
    const response = await getJson<ApiResponse<User>>(`/api/users/${userId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'User not found');
    }
    return response.data;
  }

  // Get all users with pagination and filtering
  static async getUsers(params: UserSearchParams = {}): Promise<UserListResponse> {
    try {
      const response = await getJson<{ success: boolean; message: string; data: User[] }>('/api/users');
      if (!response.success) throw new Error(response.message || 'Failed to fetch users');
      const users = Array.isArray(response.data) ? response.data : [];
      let filteredUsers = users;
      if (params.query) {
        const searchLower = params.query.toLowerCase();
        filteredUsers = users.filter(user =>
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      if (params.role) {
        filteredUsers = filteredUsers.filter(user => user.role === params.role);
      }
      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      return {
        success: true,
        message: 'Users retrieved successfully',
        data: paginatedUsers,
        total: filteredUsers.length,
        page: page,
        limit: limit
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: true,
        message: 'No users available',
        data: [],
        total: 0,
        page: 1,
        limit: 10
      };
    }
  }

  // Search users
  static async searchUsers(query: string): Promise<User[]> {
    const response = await getJson<ApiResponse<User[]>>(`/api/users/search?name=${encodeURIComponent(query)}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search users');
    }
    return response.data;
  }

  // Update user profile
  static async updateUser(userId: string | number, data: Partial<User>): Promise<User> {
    const response = await putJson<ApiResponse<User>>(`/api/users/${userId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user');
    }
    return response.data;
  }

  // Update user profile (admin endpoint)
  static async updateUserAdmin(userId: string | number, data: Partial<User>): Promise<User> {
    const response = await putJson<ApiResponse<User>>(`/api/users/admin/${userId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user');
    }
    return response.data;
  }

  // Update user role
  static async updateUserRole(userId: string | number, role: string): Promise<User> {
    const response = await putJson<ApiResponse<User>>(`/api/users/admin/${userId}/roles`, { role });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user role');
    }
    return response.data;
  }

  // Verify/unverify user
  static async updateUserVerification(userId: string | number, verified: boolean): Promise<User> {
    const response = await putJson<ApiResponse<User>>(`/api/users/admin/${userId}/verify`, { verified });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user verification');
    }
    return response.data;
  }

  // Reset user password
  static async resetUserPassword(userId: string | number): Promise<{ success: boolean; message: string }> {
    const response = await postJson<ApiResponse<{ success: boolean; message: string }>>(`/api/users/admin/${userId}/reset-password`, {});
    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
    return response.data || { success: true, message: 'Password reset successfully' };
  }

  // Get user activity log
  static async getUserActivity(userId: string | number): Promise<ActivityLogItem[]> {
    try {
      const response = await getJson<ApiResponse<ActivityLogItem[]>>(`/api/users/${userId}/activity`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch activity log');
      }
      return response.data;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        console.log('User activity endpoint not available');
      }
      return [];
    }
  }

  // Get user IP logs
  static async getUserIPLogs(userId: string | number): Promise<IPLog[]> {
    try {
      const response = await getJson<ApiResponse<IPLog[]>>(`/api/users/${userId}/ip-logs`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch IP logs');
      }
      return response.data;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        console.log('User IP logs endpoint not available');
      }
      return [];
    }
  }

  // Upload user avatar
  static async uploadAvatar(userId: string | number, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('img', file);

    const response = await fetch(apiUrl(`/api/users/${userId}/avatar`), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload avatar');
    }

    const data = await response.json();
    if (!data.success || !data.data?.url) {
      throw new Error(data.message || 'Failed to upload avatar');
    }

    return data.data;
  }

  // Delete user
  static async deleteUser(userId: string | number): Promise<{ success: boolean; message: string }> {
    const response = await deleteJson<ApiResponse<{ success: boolean; message: string }>>(`/api/users/${userId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user');
    }
    return response.data || { success: true, message: 'User deleted successfully' };
  }

  // Bulk operations
  static async bulkUpdateUsers(operation: BulkOperation): Promise<{ success: boolean; message: string }> {
    const response = await postJson<ApiResponse<{ success: boolean; message: string }>>('/api/users/bulk', operation);
    if (!response.success) {
      throw new Error(response.message || 'Failed to perform bulk operation');
    }
    return response.data || { success: true, message: 'Bulk operation completed' };
  }

  // Get admin statistics
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await getJson<ApiResponse<AdminStats>>('/api/admin/stats');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch admin statistics');
      }
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      return {
        totalUsers: 0,
        activeSessions: 0,
        systemStatus: 'Offline',
        newUsersToday: 0,
        totalRevenue: 0,
        activeSellers: 0
      };
    }
  }

  // Get users by role
  static async getUsersByRole(role: string, page: number = 1, limit: number = 10): Promise<UserListResponse> {
    const response = await getJson<UserListResponse>(`/api/users?role=${role}&page=${page}&limit=${limit}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch users by role');
    }
    return response;
  }

  // Promote user to admin
  static async promoteToAdmin(userId: string | number): Promise<User> {
    const response = await postJson<ApiResponse<User>>(`/api/users/${userId}/promote-admin`, {});
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to promote user to admin');
    }
    return response.data;
  }

  // Request seller status
  static async requestSellerStatus(userId: string | number, data: { businessName: string; phone: string; paypalEmail?: string }): Promise<User> {
    const response = await postJson<ApiResponse<User>>(`/api/users/${userId}/request-seller`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to submit seller request');
    }
    return response.data;
  }

  // Approve seller request
  static async approveSellerRequest(userId: string | number): Promise<User> {
    const response = await postJson<ApiResponse<User>>(`/api/users/${userId}/approve-seller`, {});
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to approve seller request');
    }
    return response.data;
  }

  // Export user data
  static async exportUserData(userId: string | number): Promise<Blob> {
    const response = await fetch(apiUrl(`/api/users/${userId}/export`));
    if (!response.ok) throw new Error('Failed to export user data');
    return response.blob();
  }

  // Get user notifications
  static async getUserNotifications(userId: string | number): Promise<any[]> {
    const response = await getJson<ApiResponse<any[]>>(`/api/users/${userId}/notifications`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch notifications');
    }
    return response.data;
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await putJson<ApiResponse<{ success: boolean }>>(`/api/notifications/${notificationId}/read`, {});
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark notification as read');
    }
    return response.data || { success: true };
  }
}

// Utility functions
export const transformUserData = (user: any): User => {
  if (!user) throw new Error('User data is required');
  return {
    id: user.id || user._id || 'unknown',
    name: user.name || user.username || 'Unknown User',
    firstName: user.firstName || user.firstname || '',
    lastName: user.lastName || user.lastname || '',
    email: user.email || '',
    mobile: user.mobile || user.phone || '',
    avatar: user.avatar || user.profilepicture || '',
    role: user.role || 'buyer',
    title: user.title || (user.role === 'admin' ? 'System Administrator' : user.role || 'User'),
    bio: user.bio || '',
    location: user.location || '',
    verified: user.verified || false,
    createdAt: user.createdAt || user.created_at || new Date().toISOString(),
    updatedAt: user.updatedAt || user.updated_at || new Date().toISOString(),
    lastActive: user.lastActive || user.last_active || new Date().toISOString(),
    business_name: user.business_name || '',
    latitude: user.latitude || 0,
    longitude: user.longitude || 0,
    addressinfo: user.addressinfo || {},
    shipping_fee: user.shipping_fee || 0,
    seller_request: user.seller_request || 'none',
    paypal_email: user.paypal_email || '',
    external_auth_id: user.external_auth_id || '',
  };
};

export const getOnlineStatus = (user: User): boolean => {
  if (!user.lastActive) return false;
  const lastActiveTime = new Date(user.lastActive);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastActiveTime > fiveMinutesAgo;
};

export const getUserDisplayName = (user: User): string => {
  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return 'Unknown User';
};

export const getUserInitials = (user: User): string => {
  const name = getUserDisplayName(user);
  return name
    .split(' ')
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
};
