import { getJson, postJson, putJson, deleteJson, apiUrl } from './api';

// TypeScript interfaces for payment data
export interface PaymentMethod {
  _id: string;
  name: string;
  type: 'gcash' | 'paypal' | 'cod' | 'bank' | 'card';
  isActive: boolean;
  fees: {
    fixed: number;
    percentage: number;
  };
  settings: Record<string, any>;
}

export interface PaymentTransaction {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
  referenceNumber?: string;
  transactionId?: string;
  gatewayResponse?: any;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface PaymentRefund {
  _id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  processedBy: string;
  processedAt?: string;
  gatewayRefundId?: string;
}

export interface PaymentDispute {
  _id: string;
  paymentId: string;
  orderId: string;
  reason: string;
  status: 'open' | 'resolved' | 'closed';
  raisedBy: string;
  raisedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  evidence?: string[];
}

export interface SellerPayout {
  _id: string;
  sellerId: string;
  sellerName: string;
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payoutMethod: 'gcash' | 'paypal' | 'bank';
  payoutDetails: {
    gcashNumber?: string;
    gcashName?: string;
    paypalEmail?: string;
    bankAccount?: string;
  };
  orderIds: string[];
  createdAt: string;
  processedAt?: string;
}

export interface PaymentSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentListResponse {
  success: boolean;
  data: PaymentTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

export interface PaymentStats {
  totalTransactions: number;
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  disputedPayments: number;
  averageTransactionValue: number;
  successRate: number;
  platformEarnings: number;
  pendingPayouts: number;
  paymentMethodDistribution: Record<string, { count: number; amount: number }>;
}

export class PaymentApiService {
  // Get all payments with filtering and pagination
  static async getPayments(params: PaymentSearchParams = {}): Promise<PaymentListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.paymentMethod) query.append('paymentMethod', params.paymentMethod);
    if (params.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params.dateTo) query.append('dateTo', params.dateTo);
    if (params.sellerId) query.append('sellerId', params.sellerId);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const url = `/orders/payments?${query.toString()}`;
    const response = await getJson<PaymentListResponse>(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch payments');
    }
    return response;
  }

  // Get payment by ID
  static async getPayment(id: string): Promise<PaymentTransaction> {
    const response = await getJson<{ success: boolean; data: PaymentTransaction; message?: string }>(`/orders/payments/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch payment');
    }
    return response.data;
  }

  // Process refund for a payment
  static async processRefund(paymentId: string, amount: number, reason: string, adminId?: string): Promise<PaymentRefund> {
    const response = await postJson<{ success: boolean; data: PaymentRefund; message?: string }>(`/orders/${paymentId}/refund`, {
      amount,
      reason,
      adminId
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to process refund');
    }
    return response.data;
  }

  // Create payment dispute
  static async createDispute(paymentId: string, reason: string, evidence?: string[]): Promise<PaymentDispute> {
    const response = await postJson<{ success: boolean; data: PaymentDispute; message?: string }>(`/orders/${paymentId}/resolve-dispute`, {
      resolution: 'dispute',
      notes: reason,
      evidence
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to create dispute');
    }
    return response.data;
  }

  // Resolve payment dispute
  static async resolveDispute(disputeId: string, resolution: string, resolvedBy: string): Promise<PaymentDispute> {
    const response = await postJson<{ success: boolean; data: PaymentDispute; message?: string }>(`/payments/disputes/${disputeId}/resolve`, {
      resolution,
      resolvedBy
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to resolve dispute');
    }
    return response.data;
  }

  // Get payment statistics
  static async getPaymentStats(dateFrom?: string, dateTo?: string): Promise<PaymentStats> {
    const query = new URLSearchParams();
    if (dateFrom) query.append('dateFrom', dateFrom);
    if (dateTo) query.append('dateTo', dateTo);

    const url = `/orders/payments/stats?${query.toString()}`;
    const response = await getJson<{ success: boolean; data: PaymentStats; message?: string }>(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch payment statistics');
    }
    return response.data;
  }

  // Get seller payouts
  static async getSellerPayouts(sellerId?: string): Promise<SellerPayout[]> {
    const query = sellerId ? `?sellerId=${sellerId}` : '';
    const response = await getJson<{ success: boolean; data: SellerPayout[]; message?: string }>(`/payments/payouts${query}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch seller payouts');
    }
    return response.data;
  }

  // Process seller payout
  static async processPayout(payoutId: string, payoutDetails: {
    method: 'gcash' | 'paypal' | 'bank';
    gcashNumber?: string;
    gcashName?: string;
    paypalEmail?: string;
    bankAccount?: string;
  }): Promise<{ success: boolean; transactionId?: string }> {
    const response = await postJson<{ success: boolean; transactionId?: string; message?: string }>(`/payments/payouts/${payoutId}/process`, payoutDetails);
    if (!response.success) {
      throw new Error(response.message || 'Failed to process payout');
    }
    return response;
  }

  // Bulk payment actions
  static async bulkAction(action: string, paymentIds: string[], data?: any): Promise<{ success: boolean; results: any[] }> {
    const response = await postJson<{ success: boolean; results: any[]; message?: string }>('/orders/payments/bulk-action', {
      action,
      paymentIds,
      data
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to perform bulk action');
    }
    return response;
  }

  // Export payments to CSV
  static exportToCSV(payments: PaymentTransaction[]): void {
    const headers = [
      'Payment ID',
      'Order ID',
      'Customer',
      'Amount',
      'Payment Method',
      'Status',
      'Reference Number',
      'Transaction ID',
      'Created At',
      'Updated At'
    ];

    const csvContent = [
      headers.join(','),
      ...payments.map(payment => [
        payment._id,
        payment.orderId,
        payment.userId,
        payment.amount,
        payment.paymentMethod,
        payment.status,
        payment.referenceNumber || '',
        payment.transactionId || '',
        payment.createdAt,
        payment.updatedAt
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Calculate payment statistics from payment data
  static calculateStats(payments: PaymentTransaction[]): PaymentStats {
    const totalTransactions = payments.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const successfulPayments = payments.filter(p => p.status === 'paid').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    const refundedPayments = payments.filter(p => p.status === 'refunded').length;
    const disputedPayments = payments.filter(p => p.status === 'disputed').length;
    
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const successRate = totalTransactions > 0 ? (successfulPayments / totalTransactions) * 100 : 0;
    const platformEarnings = totalRevenue * 0.05; // 5% platform fee
    
    // Payment method distribution
    const paymentMethodDistribution: Record<string, { count: number; amount: number }> = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!paymentMethodDistribution[method]) {
        paymentMethodDistribution[method] = { count: 0, amount: 0 };
      }
      paymentMethodDistribution[method].count++;
      paymentMethodDistribution[method].amount += payment.amount;
    });

    return {
      totalTransactions,
      totalRevenue,
      successfulPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      disputedPayments,
      averageTransactionValue,
      successRate,
      platformEarnings,
      pendingPayouts: 0, // This would be calculated from seller payouts
      paymentMethodDistribution
    };
  }
}
