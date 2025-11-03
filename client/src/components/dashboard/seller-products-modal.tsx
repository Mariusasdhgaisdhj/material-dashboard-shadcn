import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
import { 
  X, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  Calendar,
  MapPin,
  Star,
  Eye,
  ExternalLink
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  images?: Array<{ url: string; _id: string }>;
  proCategoryId?: { name: string; _id: string };
  proSubCategoryId?: { name: string; _id: string };
  createdAt?: string;
  status?: string;
}

interface Seller {
  id: string;
  name: string;
  owner: string;
  revenue: number;
  stockCount: number;
  products: Product[];
}

interface SellerProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: Seller | null;
}

export function SellerProductsModal({ isOpen, onClose, seller }: SellerProductsModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  // Fetch real products for the selected seller
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products', seller?.id],
    queryFn: () => getJson<any>(`/products?sellerId=${seller?.id}&limit=100`),
    enabled: !!seller?.id && isOpen,
    retry: 2,
    staleTime: 30000,
  });

  // Normalize products data
  const realProducts: Product[] = productsData?.success && Array.isArray(productsData.data) 
    ? productsData.data.map((product: any) => ({
        id: product._id || product.id,
        name: product.name || product.productName || 'Unnamed Product',
        description: product.description || '',
        price: product.price || product.cost || 0,
        quantity: product.quantity || product.stock || product.stockQuantity || 0,
        images: product.images || [],
        proCategoryId: product.proCategoryId || null,
        proSubCategoryId: product.proSubCategoryId || null,
        createdAt: product.createdAt || product.created_at,
        status: product.status || product.availability || 'available'
      }))
    : [];

  if (!seller) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format description like in Flutter app
  const formatDescription = (description: string) => {
    if (!description || description === 'No description available.') {
      return { isFormatted: false, content: description, entries: [] };
    }

    const lines = description.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const entries: Array<{ key: string; value: string }> = [];
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && colonIndex < line.length - 1) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key.length <= 40 && value.length > 0) {
          entries.push({ key, value });
        }
      }
    }

    return {
      isFormatted: entries.length > 0,
      content: description,
      entries: entries
    };
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-white p-0">
            <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                      {seller.name} Products
                    </DialogTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      Owner: {seller.owner} • {realProducts.length} products • ₱{seller.revenue.toLocaleString()} revenue
                    </p>
                  </div>
                </div>
                
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto bg-white p-6">
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-3 w-3/4 mb-3" />
                        <div className="flex items-center justify-between mb-3">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : realProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {realProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card 
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                <Package className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-purple-600 transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {product.proCategoryId?.name || 'Uncategorized'}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getStatusColor(product.status)}`}
                            >
                              {product.status || 'Available'}
                            </Badge>
                          </div>

                          {product.description && (
                            <div className="mb-3">
                              {(() => {
                                const formatted = formatDescription(product.description);
                                if (formatted.isFormatted) {
                                  return (
                                    <div className="text-xs text-slate-600">
                                      <div className="flex items-center mb-1">
                                        <span className="text-green-600 mr-1">🌱</span>
                                        <span className="font-semibold text-green-800">Care & Maintenance</span>
                                      </div>
                                      <div className="line-clamp-2">
                                        {formatted.entries.slice(0, 2).map((entry, index) => (
                                          <div key={index} className="text-xs">
                                            <span className="font-semibold">{entry.key}:</span> {entry.value}
                                          </div>
                                        ))}
                                        {formatted.entries.length > 2 && (
                                          <div className="text-slate-500 text-xs">
                                            +{formatted.entries.length - 2} more...
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <p className="text-xs text-slate-600 line-clamp-2">
                                      {formatted.content}
                                    </p>
                                  );
                                }
                              })()}
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-bold text-green-600">
                                ₱{product.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                              <Package className="w-3 h-3" />
                              <span>{product.quantity} in stock</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(product.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-purple-600 group-hover:text-purple-700">
                              <Eye className="w-3 h-3" />
                              <span>View Details</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Products Found
                  </h3>
                  <p className="text-slate-500">
                    This seller hasn't added any products yet.
                  </p>
                </div>
              )}
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
              {selectedProduct && (
                <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] bg-white p-0">
                    <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold text-slate-900">
                          Product Details
                        </DialogTitle>
                       
                      </div>
                    </DialogHeader>

                    <div className="max-h-[calc(90vh-120px)] overflow-y-auto bg-white p-6 space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {selectedProduct.name}
                          </h2>
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge 
                              variant="secondary" 
                              className={`text-sm ${getStatusColor(selectedProduct.status)}`}
                            >
                              {selectedProduct.status || 'Available'}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {selectedProduct.proCategoryId?.name || 'Uncategorized'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedProduct.description && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Description
                          </h3>
                          {(() => {
                            const formatted = formatDescription(selectedProduct.description);
                            if (formatted.isFormatted) {
                              return (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center mb-2">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                                      <span className="text-white text-xs">🌱</span>
                                    </div>
                                    <span className="font-semibold text-green-800">Care & Maintenance</span>
                                  </div>
                                  <div className="space-y-2">
                                    {formatted.entries.map((entry, index) => (
                                      <div key={index} className="flex items-start">
                                        <span className="text-slate-500 mr-2">•</span>
                                        <div className="flex-1">
                                          <span className="font-semibold text-slate-800">{entry.key}: </span>
                                          <span className="text-slate-700">{entry.value}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <p className="text-slate-600 leading-relaxed">
                                  {formatted.content}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-slate-900">Price</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            ₱{selectedProduct.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-slate-900">Stock</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedProduct.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <span className="font-semibold text-slate-900">Created</span>
                          </div>
                          <p className="text-slate-600">
                            {formatDate(selectedProduct.createdAt)}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <ShoppingBag className="w-5 h-5 text-orange-500" />
                            <span className="font-semibold text-slate-900">Category</span>
                          </div>
                          <p className="text-slate-600">
                            {selectedProduct.proCategoryId?.name || 'Uncategorized'}
                            {selectedProduct.proSubCategoryId?.name && 
                              ` • ${selectedProduct.proSubCategoryId.name}`
                            }
                          </p>
                        </div>
                      </div>

                      {selectedProduct.images && selectedProduct.images.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-3">
                            Product Images
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedProduct.images.map((image, index) => (
                              <div 
                                key={image._id || index} 
                                className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                                onClick={() => setSelectedImage({
                                  url: image.url,
                                  alt: `${selectedProduct.name} ${index + 1}`
                                })}
                              >
                                <img 
                                  src={image.url} 
                                  alt={`${selectedProduct.name} ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/placeholder-product.png';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      )}

      {/* Full Screen Image Viewer - Outside main modal to prevent conflicts */}
      <AnimatePresence>
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-7xl h-[95vh] flex flex-col bg-black p-0 border-0">
              <DialogHeader className="p-4 bg-black border-b border-gray-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-white text-lg">
                    {selectedImage.alt}
                  </DialogTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:bg-gray-800"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="relative max-w-full max-h-full"
                >
                  <img 
                    src={selectedImage.url} 
                    alt={selectedImage.alt}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder-product.png';
                    }}
                  />
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
