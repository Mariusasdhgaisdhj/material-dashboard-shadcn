import { apiUrl } from './api';

// PayMongo API interfaces
export interface PayMongoSource {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    livemode: boolean;
    status: 'pending' | 'chargeable' | 'consumed' | 'failed';
    type: 'gcash' | 'grab_pay';
    redirect: {
      checkout_url: string;
      success: string;
      failed: string;
    };
    created_at: number;
    updated_at: number;
  };
}

export interface PayMongoPayment {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    livemode: boolean;
    status: 'pending' | 'paid' | 'failed' | 'canceled';
    source: {
      id: string;
      type: string;
    };
    created_at: number;
    updated_at: number;
  };
}

export interface PayMongoPayout {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description: string;
    livemode: boolean;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    payout_method: 'gcash' | 'bank';
    payout_details: {
      gcash_number?: string;
      gcash_name?: string;
      bank_account?: string;
      bank_name?: string;
    };
    created_at: number;
    updated_at: number;
  };
}

export interface PayMongoError {
  errors: Array<{
    code: string;
    detail: string;
    source?: {
      pointer: string;
    };
  }>;
}

export class PayMongoApiService {
  private static baseUrl = 'https://api.paymongo.com/v1';
  private static publicKey: string;
  private static secretKey: string;

  // Initialize with API keys
  static initialize(publicKey: string, secretKey: string) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
  }

  // Create a GCash source for payout authorization
  static async createGCashSource(amount: number, description: string, successUrl: string, failedUrl: string): Promise<PayMongoSource> {
    if (!this.publicKey) {
      throw new Error('PayMongo not initialized. Please set VITE_PAYMONGO_PUBLIC_KEY in your environment variables.');
    }

    const response = await fetch(`${this.baseUrl}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.publicKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos
            currency: 'PHP',
            type: 'gcash',
            description,
            redirect: {
              success: successUrl,
              failed: failedUrl,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error: PayMongoError = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create GCash source');
    }

    const result = await response.json();
    return result.data;
  }

  // Create a payment from a chargeable source
  static async createPayment(sourceId: string, amount: number, description: string): Promise<PayMongoPayment> {
    if (!this.secretKey) {
      throw new Error('PayMongo not initialized. Please set VITE_PAYMONGO_SECRET_KEY in your environment variables.');
    }

    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.secretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos
            currency: 'PHP',
            description,
            source: {
              id: sourceId,
              type: 'source',
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error: PayMongoError = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment');
    }

    const result = await response.json();
    return result.data;
  }

  // Process payout to seller's GCash
  static async processGCashPayout(
    sellerId: string,
    amount: number,
    gcashNumber: string,
    gcashName: string,
    description: string
  ): Promise<{ success: boolean; payoutId?: string; checkoutUrl?: string; error?: string }> {
    try {
      console.log('Processing GCash payout:', { sellerId, amount, gcashNumber, gcashName, description });
      
      // Call the backend endpoint that handles everything (creates source, stores in DB, sends notifications)
      // Use full URL with hash for HashRouter
      const successUrl = `${window.location.origin}/#/payouts/success?sellerId=${sellerId}`;
      const failedUrl = `${window.location.origin}/#/payouts/failed?sellerId=${sellerId}`;
      
      const response = await fetch(apiUrl('/paymongo/payout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId,
          amount,
          gcashNumber,
          gcashName,
          notes: description,
          successUrl,
          failedUrl
        }),
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to process payout');
      }

      return {
        success: true,
        payoutId: data.data?.sourceId,
        checkoutUrl: data.checkoutUrl
      };
    } catch (error) {
      console.error('Error processing GCash payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check payout status
  static async getPayoutStatus(payoutId: string): Promise<{ status: string; paymentId?: string }> {
    try {
      const response = await fetch(apiUrl(`/paymongo/payouts/${payoutId}/status`));
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get payout status');
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to check payout status');
    }
  }

  // Complete payout after seller authorization
  static async completePayout(payoutId: string): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const response = await fetch(apiUrl(`/paymongo/payouts/${payoutId}/complete`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete payout');
      }

      return {
        success: true,
        paymentId: data.paymentId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete payout'
      };
    }
  }

  // Get payout history
  static async getPayoutHistory(sellerId?: string): Promise<any[]> {
    try {
      const query = sellerId ? `?sellerId=${sellerId}` : '';
      const response = await fetch(apiUrl(`/paymongo/payouts${query}`));
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get payout history');
      }

      return data.payouts || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get payout history');
    }
  }
}

// Initialize with environment variables (these should be set in your .env file)
if (typeof window !== 'undefined') {
  const publicKey = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || '';
  const secretKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY || '';
  
  if (publicKey && secretKey) {
    PayMongoApiService.initialize(publicKey, secretKey);
  } else {
    console.warn('PayMongo API keys not found. Please set VITE_PAYMONGO_PUBLIC_KEY and VITE_PAYMONGO_SECRET_KEY in your .env file');
  }
}
