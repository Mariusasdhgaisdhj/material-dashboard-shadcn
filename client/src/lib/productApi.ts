import { getJson, apiUrl } from './api';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  offerPrice?: number;
  hidden?: boolean;
  archived?: boolean;
  sellerId?: {
    _id: string;
    name: string;
    email: string;
    businessName?: string;
    verified: boolean;
  };
  proCategoryId?: {
    _id: string;
    name: string;
  };
  proSubCategoryId?: {
    _id: string;
    name: string;
  };
  proBrandId?: {
    _id: string;
    name: string;
  };
  images?: Array<{
    _id: string;
    image: number;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProductApiService {
  // Get all products with pagination and filtering
  static async getProducts(params: ProductSearchParams = {}): Promise<ProductListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.subCategoryId) queryParams.append('subCategoryId', params.subCategoryId);
      if (params.sellerId) queryParams.append('sellerId', params.sellerId);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const queryString = queryParams.toString();
      const url = queryString ? `/products?${queryString}` : '/products';
      
      const response = await getJson<ProductListResponse>(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch products');
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get a single product by ID
  static async getProduct(id: string): Promise<Product> {
    try {
      const response = await getJson<{ success: boolean; message: string; data: Product }>(`/products/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Product not found');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Create a new product
  static async createProduct(productData: FormData): Promise<Product> {
    try {
      const response = await fetch(apiUrl('/products'), {
        method: 'POST',
        body: productData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create product');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update a product
  static async updateProduct(id: string, productData: FormData): Promise<Product> {
    try {
      const response = await fetch(apiUrl(`/products/${id}`), {
        method: 'PUT',
        body: productData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update product');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update product');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Update visibility flags (hidden/archived) using JSON body
  static async updateFlags(id: string, flags: { hidden?: boolean; archived?: boolean }): Promise<Product> {
    const response = await fetch(apiUrl(`/products/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flags),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update product flags');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to update product flags');
    }
    return result.data;
  }

  // Notify seller about product updates
  static async notify(productId: string, payload: { type: string; sellerId: string; productName?: string; message?: string }): Promise<void> {
    const response = await fetch(apiUrl(`/products/${productId}/notify`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send notification');
    }
  }

  // Delete a product
  static async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(apiUrl(`/products/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Bulk delete products
  static async bulkDeleteProducts(ids: string[]): Promise<void> {
    try {
      const deletePromises = ids.map(id => this.deleteProduct(id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      throw error;
    }
  }

  // Export products to CSV
  static exportToCSV(products: Product[]): void {
    const csvData = products.map(product => ({
      Name: product.name,
      Price: product.price,
      Quantity: product.quantity,
      Category: product.proCategoryId?.name || '-',
      Subcategory: product.proSubCategoryId?.name || '-',
      Seller: product.sellerId?.name || '-',
      'Created At': new Date(product.createdAt).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
