import { getJson, apiUrl } from "./api";

// Define your Order related types here
export interface OrderItem {
  _id: string;
  productID: string;
  productName: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface Address {
  phone?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  companyName?: string;
  taxId?: string;
}

export interface Coupon {
  _id: string;
  couponCode: string;
  discountType: string;
  discountAmount: number;
}

export interface Order {
  _id: string;
  userID: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  orderStatus: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: string;
  referenceNumber?: string;
  couponCode?: Coupon;
  trackingUrl?: string;
  orderDate: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  cancellationRequested?: boolean;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  paidOut?: boolean;
}

export interface OrderSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
  search?: string;
}

export interface OrderListResponse {
  success: boolean;
  message: string;
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderStats {
  total: number;
  revenue: number;
  paid: number;
  pending: number;
  cancelled: number;
  avgOrderValue: number;
}

export class OrderApiService {
  static async getOrders(params: OrderSearchParams = {}): Promise<OrderListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    if (params.paymentMethod) query.append('paymentMethod', params.paymentMethod);
    if (params.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params.dateTo) query.append('dateTo', params.dateTo);
    if (params.sellerId) query.append('sellerId', params.sellerId);

    const url = `/orders?${query.toString()}`;
    const response = await getJson<OrderListResponse>(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch orders');
    }
    return response;
  }

  static async getOrder(id: string): Promise<Order> {
    const response = await getJson<{ success: boolean; message: string; data: Order }>(`/orders/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Order not found');
    }
    return response.data;
  }

  static async updateOrderStatus(id: string, status: string): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await fetch(apiUrl(`/orders/${id}/status`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: status })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update order status');
    }
    return data;
  }

  static async cancelOrder(id: string, reason: string, userId: string): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await fetch(apiUrl(`/orders/${id}/cancel`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        reason, 
        cancelledBy: 'admin' 
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to cancel order');
    }
    return data;
  }

  static async processRefund(id: string, amount: number, reason?: string, adminId?: string): Promise<{ success: boolean; message: string; data: any }> {
    const response = await fetch(apiUrl(`/orders/${id}/refund`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        reason: reason || 'Admin initiated refund',
        adminId 
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to process refund');
    }
    return data;
  }

  static async handleCancellationRequest(id: string, approved: boolean): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await fetch(apiUrl(`/orders/${id}/cancel-request`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to handle cancellation request');
    }
    return data;
  }

  static async updateShipping(id: string, shippingData: {
    shippingAddress?: Address;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await fetch(apiUrl(`/orders/${id}/shipping`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shippingData)
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update shipping information');
    }
    return data;
  }

  static async bulkAction(action: string, orderIds: string[], data?: any): Promise<{ success: boolean; message: string; data: any }> {
    const response = await fetch(apiUrl('/orders/bulk-action'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderIds, 
        action, 
        data 
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Bulk action failed');
    }
    return result;
  }

  static async resolveDispute(id: string, resolution: string, adminId?: string, notes?: string): Promise<{ success: boolean; message: string; data: Order }> {
    const response = await fetch(apiUrl(`/orders/${id}/resolve-dispute`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        resolution, 
        adminId, 
        notes 
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to resolve dispute');
    }
    return data;
  }

  static async markPaidOutBulk(orderIds: string[], sellerId: string, payoutInfo?: { gcashNumber?: string; gcashName?: string; notes?: string }): Promise<{ success: boolean; message: string; data: any }> {
    const response = await fetch(apiUrl('/orders/mark-paidout-bulk'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds, sellerId, payoutMethod: 'gcash', gcashNumber: payoutInfo?.gcashNumber, gcashName: payoutInfo?.gcashName, notes: payoutInfo?.notes })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to mark paid out');
    }
    return data;
  }

  static exportToCSV(orders: Order[]) {
    const csvData = orders.map(o => ({
      'Order ID': o._id,
      'Customer': o.userID?.name || 'Unknown',
      'Status': o.orderStatus,
      'Total': o.totalPrice,
      'Payment Method': o.paymentMethod,
      'Reference': o.referenceNumber || '',
      'Date': o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '',
      'Items': o.items?.length || 0
    }));
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static calculateStats(orders: Order[]): OrderStats {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const paidOrders = orders.filter(o => o.orderStatus?.toLowerCase() === 'paid');
    const pendingOrders = orders.filter(o => o.orderStatus?.toLowerCase() === 'pending');
    const cancelledOrders = orders.filter(o => o.orderStatus?.toLowerCase() === 'cancelled');
    
    return {
      total: orders.length,
      revenue: totalRevenue,
      paid: paidOrders.length,
      pending: pendingOrders.length,
      cancelled: cancelledOrders.length,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    };
  }

  // Process seller payout for completed orders
  static async processSellerPayout(sellerId: string, orderIds: string[], gcashNumber: string, gcashName: string, notes?: string): Promise<{ success: boolean; message: string; data: any }> {
    const response = await fetch(apiUrl(`/seller/${sellerId}/payout`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderIds,
        payoutMethod: 'gcash',
        processedBy: 'admin',
        gcashNumber,
        gcashName,
        adminNotes: notes
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to process payout');
    }
    return data;
  }
}
