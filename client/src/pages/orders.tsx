import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderApiService, Order, OrderSearchParams, OrderStats } from "@/lib/orderApi";
import { PayMongoApiService } from "@/lib/paymongoApi";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Truck,
  XCircle,
  RefreshCw,
  BarChart3,
  FileText,
  MapPin,
  CreditCard,
  Edit,
  Send,
  Archive,
  Printer,
  UserCheck
} from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Orders() {
  const queryClient = useQueryClient();
  
  // Search and filter states
  const [searchParams, setSearchParams] = useState<OrderSearchParams>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    paymentMethod: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });

  // Fetch orders with real API
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', searchParams],
    queryFn: () => OrderApiService.getOrders(searchParams),
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Orders data
  const orders: Order[] = ordersData?.data || [];
  const totalOrders = ordersData?.total || 0;

  // UI States
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ 
    type: "view"|"update-status"|"cancel"|"refund"|"bulk-action"|"analytics"|"shipping"|"invoice"|"cancellation-request"|"payout"; 
    id?: string 
  }|null>(null);
  
  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  
  // Payout states
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("paymongo"); // Only PayMongo now
  const [payoutUrl, setPayoutUrl] = useState("");
  const [sellerInfo, setSellerInfo] = useState<{name: string; gcashName: string; gcashNumber: string} | null>(null);
  const [loadingSellerInfo, setLoadingSellerInfo] = useState(false);
  // Payout UI helpers - in-memory only (no persistence)
  const [paidOutOrderIds, setPaidOutOrderIds] = useState<Set<string>>(new Set());
  const [lastPayoutOrderIds, setLastPayoutOrderIds] = useState<string[]>([]);
  const [payoutSellerId, setPayoutSellerId] = useState<string>("");

  // Clear paidOutOrderIds when navigating back to Orders (component visibility change)
  useEffect(() => {
    return () => {
      setPaidOutOrderIds(new Set());
      setLastPayoutOrderIds([]);
    };
  }, []);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => OrderApiService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Success', description: 'Order status updated successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => OrderApiService.cancelOrder(id, reason, 'admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Success', description: 'Order cancelled successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason?: string }) => OrderApiService.processRefund(id, amount, reason, 'admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Success', description: 'Refund processed successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const shippingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => OrderApiService.updateShipping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Success', description: 'Shipping information updated successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, orderIds, data }: { action: string; orderIds: string[]; data?: any }) => OrderApiService.bulkAction(action, orderIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Success', description: 'Bulk action completed successfully' });
      setSelectedOrders(new Set());
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const payoutMutation = useMutation({
    mutationFn: ({ sellerId, orderIds, gcashNumber, gcashName, notes }: { 
      sellerId: string; 
      orderIds: string[]; 
      gcashNumber: string; 
      gcashName: string; 
      notes?: string;
    }) => {
      return PayMongoApiService.processGCashPayout(
        sellerId,
        parseFloat(payoutAmount),
        gcashNumber,
        gcashName,
        notes || `Payout for orders: ${orderIds.join(', ')}`
      );
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      // Mark orders as paid out when payout is initiated (checkoutUrl returned)
      if (lastPayoutOrderIds.length > 0) {
        setPaidOutOrderIds(prev => {
          const next = new Set(prev);
          lastPayoutOrderIds.forEach(id => next.add(id));
          return next;
        });
      }
      
      if (data.checkoutUrl) {
        setPayoutUrl(data.checkoutUrl);
        // Close dialog and clear selected orders
        setSelectedOrders(new Set());
        setOpen(null);
        
        // Try to auto-open the GCash authorization tab
        try { window.open(data.checkoutUrl, '_blank'); } catch (_) {}
        
        toast({ 
          title: 'Payout Initiated', 
          description: 'GCash authorization page opened. Complete authorization to process the payout.',
          duration: 5000
        });
        // Persistently mark as paid out server-side
        try {
          if (payoutSellerId && lastPayoutOrderIds.length > 0) {
            await OrderApiService.markPaidOutBulk(lastPayoutOrderIds, payoutSellerId, { gcashNumber, gcashName, notes: payoutNotes });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }
        } catch (e: any) {
          console.warn('Failed to mark paid out on server:', e?.message || e);
        }
      } else {
        toast({ title: 'Success', description: 'Payout processed successfully' });
        setSelectedOrders(new Set());
        setOpen(null);
        // Also mark paid out if no checkout URL flow
        try {
          if (payoutSellerId && lastPayoutOrderIds.length > 0) {
            await OrderApiService.markPaidOutBulk(lastPayoutOrderIds, payoutSellerId, { gcashNumber, gcashName, notes: payoutNotes });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }
        } catch (e: any) {
          console.warn('Failed to mark paid out on server:', e?.message || e);
        }
      }
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const cancellationRequestMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => OrderApiService.handleCancellationRequest(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Success', description: 'Cancellation request processed successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Statistics
  const stats: OrderStats = useMemo(() => {
    return OrderApiService.calculateStats(orders);
  }, [orders]);

  // Get selected order for view/edit
  const selectedOrder = useMemo(() => {
    if (!open?.id) return null;
    return orders.find(o => o._id === open.id) || null;
  }, [open, orders]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilter = (key: keyof OrderSearchParams, value: any) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === "all" ? undefined : value;
    setSearchParams(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    OrderApiService.exportToCSV(orders);
    toast({ title: 'Success', description: 'Orders exported to CSV' });
  };

  const handleBulkAction = () => {
    if (selectedOrders.size === 0) return;
    
    // If processing payout, open payout dialog instead
    if (bulkAction === 'process_payout') {
      const selectedOrderList = orders.filter(o => selectedOrders.has(o._id))
        .filter(o => o.orderStatus?.toLowerCase() === 'completed')
        .filter(o => !o.paymentMethod?.toLowerCase().includes('cod') && 
                    !o.paymentMethod?.toLowerCase().includes('cash on delivery'));
      
      if (selectedOrderList.length === 0) {
        toast({ title: 'Error', description: 'No eligible orders selected for payout (COD orders are excluded)', variant: 'destructive' });
        return;
      }
      
      if (!import.meta.env.VITE_PAYMONGO_PUBLIC_KEY) {
        toast({ title: 'Error', description: 'PayMongo is not configured. Please set up PayMongo API keys.', variant: 'destructive' });
        return;
      }
      
      // Ensure we have the selected orders before opening dialog
      setOpen({ type: 'payout' });
      return;
    }
    
    bulkActionMutation.mutate({ 
      action: bulkAction, 
      orderIds: Array.from(selectedOrders) 
    });
  };

  const handleUpdateStatus = () => {
    if (open?.id && newStatus) {
      updateStatusMutation.mutate({ id: open.id, status: newStatus });
    }
  };

  const handleCancelOrder = () => {
    if (open?.id && cancelReason) {
      cancelOrderMutation.mutate({ id: open.id, reason: cancelReason });
    }
  };

  const handleRefund = () => {
    if (open?.id && refundAmount) {
      refundMutation.mutate({ 
        id: open.id, 
        amount: parseFloat(refundAmount),
        reason: 'Admin initiated refund'
      });
    }
  };

  const handleUpdateShipping = () => {
    if (open?.id && trackingNumber) {
      shippingMutation.mutate({ 
        id: open.id, 
        data: { trackingUrl: trackingNumber }
      });
    }
  };

  const handleCancellationRequest = (approved: boolean) => {
    if (open?.id) {
      cancellationRequestMutation.mutate({ id: open.id, approved });
    }
  };

  // Fetch seller information including GCash details
  const fetchSellerInfo = async (sellerId: string) => {
    console.log('Fetching seller info for ID:', sellerId);
    setLoadingSellerInfo(true);
    try {
      const response = await fetch(`https://serverside3.vercel.app/users/${sellerId}`);
      console.log('Seller API response status:', response.status);
      
      const data = await response.json();
      console.log('Seller API response data:', data);
      
      if (data.success && data.data) {
        const seller = data.data;
        
        // Check both payoutinfo (lowercase, database column) and payoutInfo (camelCase, API response)
        const payoutInfo = (() => {
          try {
            if (seller.payoutinfo) {
              return typeof seller.payoutinfo === 'string' ? JSON.parse(seller.payoutinfo) : seller.payoutinfo;
            }
            if (seller.payoutInfo) {
              return typeof seller.payoutInfo === 'string' ? JSON.parse(seller.payoutInfo) : seller.payoutInfo;
            }
            return {};
          } catch {
            return {};
          }
        })();
        
        console.log('Seller data:', seller);
        console.log('Payout info:', payoutInfo);
        console.log('Raw payoutinfo/payoutInfo:', { payoutinfo: seller.payoutinfo, payoutInfo: seller.payoutInfo });
        
        setSellerInfo({
          name: seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller',
          gcashName: payoutInfo.gcashName || '',
          gcashNumber: payoutInfo.gcashNumber || ''
        });
        
        // Auto-populate GCash fields
        setGcashName(payoutInfo.gcashName || '');
        setGcashNumber(payoutInfo.gcashNumber || '');
        
        if (!payoutInfo.gcashName || !payoutInfo.gcashNumber) {
          console.warn('GCash details missing in payoutInfo:', payoutInfo);
          toast({ 
            title: 'Info', 
            description: 'Seller GCash details not found. Please enter manually.',
            variant: 'destructive'
          });
        } else {
          console.log('Successfully auto-filled GCash details:', {
            gcashName: payoutInfo.gcashName,
            gcashNumber: payoutInfo.gcashNumber
          });
        }
      } else {
        console.error('API response not successful:', data);
        toast({ 
          title: 'Error', 
          description: `Failed to fetch seller info: ${data.message || 'Unknown error'}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching seller info:', error);
      toast({ 
        title: 'Warning', 
        description: 'Could not fetch seller GCash details. Please enter manually.',
        variant: 'destructive'
      });
    } finally {
      setLoadingSellerInfo(false);
    }
  };

  const handleProcessPayout = () => {
    if (!gcashNumber || !gcashName) {
      toast({ title: 'Error', description: 'Please enter GCash details', variant: 'destructive' });
      return;
    }

    if (!import.meta.env.VITE_PAYMONGO_PUBLIC_KEY) {
      toast({ title: 'Error', description: 'PayMongo is not configured. Please set up PayMongo API keys.', variant: 'destructive' });
      return;
    }

    // Get selected orders
    const selectedOrderList = Array.from(selectedOrders).map(id => orders.find(o => o._id === id)).filter(Boolean) as Order[];
    
    if (selectedOrderList.length === 0) {
      toast({ title: 'Error', description: 'No orders selected. Please select orders first.', variant: 'destructive' });
      return;
    }
    
    // Filter out COD orders
    const eligibleOrders = selectedOrderList.filter(o => 
      !o.paymentMethod?.toLowerCase().includes('cod') && 
      !o.paymentMethod?.toLowerCase().includes('cash on delivery')
    );
    
    if (eligibleOrders.length === 0) {
      toast({ title: 'Error', description: 'No eligible orders for payout (COD orders are excluded)', variant: 'destructive' });
      return;
    }
    
    // Check if all eligible orders are completed
    const allCompleted = eligibleOrders.every(o => o.orderStatus?.toLowerCase() === 'completed');
    if (!allCompleted) {
      toast({ title: 'Error', description: 'Only completed orders can be processed for payout', variant: 'destructive' });
      return;
    }

    // Get unique seller IDs from eligible orders - try multiple ways to extract seller ID
    const sellerIds: string[] = [];
    eligibleOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        const firstItem = order.items[0];
        let sellerId: string | undefined;
        
        // Try multiple ways to get seller_id
        if (firstItem.productID && typeof firstItem.productID === 'object') {
          // Method 1: Direct seller_id property
          if ('seller_id' in firstItem.productID) {
            sellerId = (firstItem.productID as any).seller_id;
          }
          // Method 2: sellerId property
          else if ('sellerId' in firstItem.productID) {
            sellerId = (firstItem.productID as any).sellerId;
          }
          // Method 3: seller property
          else if ('seller' in firstItem.productID && typeof (firstItem.productID as any).seller === 'object') {
            const seller = (firstItem.productID as any).seller;
            sellerId = seller.id || seller._id || seller.seller_id || seller.sellerId;
          }
        }
        
        // Method 4: Check if productID is a string (MongoDB ObjectId)
        else if (typeof firstItem.productID === 'string') {
          // If productID is a string, we need to get seller info differently
          // This might be a product ID that needs to be looked up
          console.log('ProductID is string, need to handle differently:', firstItem.productID);
        }
        
        // Method 5: Check for seller_id directly on the item
        if (!sellerId && 'seller_id' in firstItem) {
          sellerId = (firstItem as any).seller_id;
        }
        
        // Method 6: Check for sellerId directly on the item
        if (!sellerId && 'sellerId' in firstItem) {
          sellerId = (firstItem as any).sellerId;
        }
        
        console.log('Extracted seller ID:', sellerId, 'from item:', firstItem);
        
        if (sellerId && !sellerIds.includes(sellerId)) {
          sellerIds.push(sellerId);
        }
      }
    });
    
    console.log('All extracted seller IDs:', sellerIds);
    
    if (sellerIds.length === 0) {
      // Try to get seller ID from order level properties as fallback
      console.log('No seller IDs found in items, trying order level properties...');
      console.log('First eligible order:', eligibleOrders[0]);
      
      // Check if there's a seller_id or sellerId at the order level
      const firstOrder = eligibleOrders[0] as any;
      let fallbackSellerId: string | undefined;
      
      if (firstOrder.seller_id) {
        fallbackSellerId = firstOrder.seller_id;
      } else if (firstOrder.sellerId) {
        fallbackSellerId = firstOrder.sellerId;
      } else if (firstOrder.sellerID) {
        fallbackSellerId = firstOrder.sellerID;
      } else if (firstOrder.seller && typeof firstOrder.seller === 'object') {
        const seller = firstOrder.seller as any;
        fallbackSellerId = seller.id || seller._id || seller.seller_id || seller.sellerId;
      }
      
      console.log('Fallback seller ID:', fallbackSellerId);
      
      if (fallbackSellerId) {
        sellerIds.push(fallbackSellerId);
      } else {
        toast({ 
          title: 'Error', 
          description: 'Could not find seller information. The order data may be incomplete. Please contact support.', 
          variant: 'destructive' 
        });
        return;
      }
    }

    if (sellerIds.length > 1) {
      toast({ title: 'Error', description: 'Please select orders from a single seller', variant: 'destructive' });
      return;
    }

    const orderIds = eligibleOrders.map(o => o._id);
    const totalAmount = eligibleOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    
    // Remember which orders we are paying out to update UI on success
    setLastPayoutOrderIds(orderIds);

    setPayoutSellerId(sellerIds[0]);
    payoutMutation.mutate({
      sellerId: sellerIds[0],
      orderIds,
      gcashNumber,
      gcashName,
      notes: payoutNotes
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSet = new Set(selectedOrders);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
    } else {
      newSet.add(orderId);
    }
    setSelectedOrders(newSet);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o._id)));
    }
  };

  // Initialize form when opening dialogs
  useEffect(() => {
    if (open?.type === 'update-status' && selectedOrder) {
      setNewStatus(selectedOrder.orderStatus || 'pending');
    } else if (open?.type === 'refund' && selectedOrder) {
      setRefundAmount(String(selectedOrder.totalPrice || 0));
    } else if (open?.type === 'shipping') {
      setTrackingNumber('');
    } else if (open?.type === 'cancel') {
      setCancelReason('');
    } else if (open?.type === 'payout') {
      // Calculate total amount for selected completed orders (excluding COD)
      const selectedOrderList = orders.filter(o => selectedOrders.has(o._id))
        .filter(o => o.orderStatus?.toLowerCase() === 'completed')
        .filter(o => !o.paymentMethod?.toLowerCase().includes('cod') && 
                    !o.paymentMethod?.toLowerCase().includes('cash on delivery'));
      const totalAmount = selectedOrderList.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      setPayoutAmount(totalAmount.toFixed(2));
      
      // Get seller info from first order
      if (selectedOrderList.length > 0) {
        const firstOrder = selectedOrderList[0] as any;
        console.log('First selected order for seller info:', firstOrder);
        console.log('Full order structure:', JSON.stringify(firstOrder, null, 2));
        
        if (firstOrder.items && firstOrder.items.length > 0) {
          const firstItem = firstOrder.items[0];
          console.log('First item for seller info:', firstItem);
          console.log('Full item structure:', JSON.stringify(firstItem, null, 2));
          
          let sellerId: string | undefined;
          
          // Try multiple methods to get seller ID
          if (firstItem.productID && typeof firstItem.productID === 'object') {
            console.log('ProductID is object:', firstItem.productID);
            console.log('ProductID keys:', Object.keys(firstItem.productID));
            
            if ('seller_id' in firstItem.productID) {
              sellerId = (firstItem.productID as any).seller_id;
              console.log('Found seller_id in productID:', sellerId);
            } else if ('sellerId' in firstItem.productID) {
              sellerId = (firstItem.productID as any).sellerId;
              console.log('Found sellerId in productID:', sellerId);
            }
          }
          
          // Try productID as string
          if (!sellerId && typeof firstItem.productID === 'string') {
            console.log('ProductID is string:', firstItem.productID);
          }
          
          // Try order level seller ID as fallback
          if (!sellerId) {
            if (firstOrder.seller_id) {
              sellerId = firstOrder.seller_id;
              console.log('Found seller_id at order level:', sellerId);
            } else if (firstOrder.sellerId) {
              sellerId = firstOrder.sellerId;
              console.log('Found sellerId at order level:', sellerId);
            } else if (firstOrder.sellerID) {
              sellerId = firstOrder.sellerID;
              console.log('Found sellerID at order level:', sellerId);
            }
          }
          
          // Also check for seller information directly on the order
          if (!sellerId && firstOrder.seller) {
            const seller = firstOrder.seller;
            sellerId = seller.id || seller._id || seller.seller_id || seller.sellerId;
            console.log('Found seller object at order level:', seller);
          }
          
          console.log('Final extracted seller ID for info fetch:', sellerId);
          
          if (sellerId) {
            fetchSellerInfo(sellerId);
          } else {
            console.error('Could not extract seller ID from order data. Full order:', firstOrder);
            console.error('Order keys:', Object.keys(firstOrder));
            console.error('First item keys:', Object.keys(firstItem));
            toast({ 
              title: 'Warning', 
              description: 'Could not find seller ID in order data. Please enter GCash details manually.',
              variant: 'destructive'
            });
          }
        }
      } else {
        // If no orders selected, show warning
        toast({ 
          title: 'No Orders Selected', 
          description: 'Please select completed orders before processing payout.',
          variant: 'destructive'
        });
      }
      
      setPayoutNotes('');
    } else if (!open) {
      // Clear seller info when dialog is closed
      setSellerInfo(null);
      setGcashName('');
      setGcashNumber('');
      setPayoutUrl('');
    }
  }, [open, selectedOrder, selectedOrders, orders]);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-900">Error Loading Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <p className="text-red-600 mb-4">Failed to load orders. Please try again.</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6 custom-scrollbar"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-100"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex justify-between items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-3 mb-2"
              >
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Orders
                </h1>
               
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-slate-600 text-lg"
              >
                Track and manage customer orders
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center space-x-2"
            >
             
             
              {selectedOrders.size > 0 && (
                <Button 
                  onClick={() => setOpen({ type: 'bulk-action' })}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Bulk ({selectedOrders.size})
                </Button>
              )}
            </motion.div>
          </div>

         
        </div>
      </motion.div>

      {/* Main Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="border-orange-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Order Management</CardTitle>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
               
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by order ID, customer, or reference..." 
                  value={searchParams.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select 
                value={searchParams.status || 'all'} 
                onValueChange={(v) => handleFilter('status', v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="to_receive">Awaiting Buyer Confirmation</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancellation_requested">Cancellation Requests</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={searchParams.paymentMethod || 'all'} 
                onValueChange={(v) => handleFilter('paymentMethod', v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                 
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setSearchParams({ page: 1, limit: 10, search: '', status: undefined, paymentMethod: undefined })}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {/* Bulk Actions */}
            {selectedOrders.size > 0 && (
              <div className="p-4 bg-red-50 border-b">
                <div className="flex justify-between items-center">
                  <span>{selectedOrders.size} selected</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setOpen({ type: 'bulk-action' })}
                  >
                    Bulk Actions
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox 
                        checked={selectedOrders.size === orders.length && orders.length > 0} 
                        onCheckedChange={toggleAllOrders}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  <AnimatePresence>
                    {orders.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={8} className="px-6 py-8 text-center text-stone-500">No orders found</td>
                      </motion.tr>
                    ) : (
                      orders.map((order, idx) => (
                        <motion.tr 
                          key={order._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.02 }}
                          className="hover:bg-stone-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedOrders.has(order._id)} 
                              onCheckedChange={() => toggleOrderSelection(order._id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">
                            {order._id?.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              {order.userID?.name || "Unknown"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const status = order.orderStatus?.toLowerCase() || 'pending';
                              const hasCancellationRequest = order.cancellationRequested;
                              const displayStatus = hasCancellationRequest ? 'cancellation_requested' : status;
                              
                              const colorMap: Record<string, string> = {
                                paid: 'bg-green-100 text-green-800',
                                pending: 'bg-yellow-100 text-yellow-800',
                                cancelled: 'bg-red-100 text-red-800',
                                processing: 'bg-blue-100 text-blue-800',
                                shipped: 'bg-purple-100 text-purple-800',
                                to_receive: 'bg-amber-100 text-amber-800',
                                completed: 'bg-emerald-100 text-emerald-800',
                                cancellation_requested: 'bg-orange-100 text-orange-800'
                              };
                              
                              // Map status to display name
                              const getStatusLabel = (stat: string) => {
                                const statusMap: Record<string, string> = {
                                  'to_receive': 'Awaiting Buyer',
                                  'completed': 'Completed',
                                  'cancellation_requested': 'Cancellation Requested'
                                };
                                return statusMap[stat] || stat;
                              };

                              return (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className={colorMap[displayStatus] || 'bg-slate-100 text-slate-800'}>
                                    {hasCancellationRequest ? 'Cancellation Requested' : getStatusLabel(displayStatus)}
                                  </Badge>
                                  {hasCancellationRequest && (
                                    <span className="text-xs text-orange-600 font-medium">
                                      Reason: {order.cancellationReason || 'No reason provided'}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-semibold">
                            ₱{order.totalPrice?.toLocaleString() || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-slate-400" />
                              {order.paymentMethod || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-1 flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setOpen({ type: "view", id: order._id })}
                                title="View Details"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-blue-600 border-blue-300"
                                onClick={() => {
                                  setNewStatus(order.orderStatus || 'pending');
                                  setOpen({ type: "update-status", id: order._id });
                                }}
                                title="Update Status"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                             
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-300"
                                onClick={() => setOpen({ type: "invoice", id: order._id })}
                                title="Invoice"
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-orange-600 border-orange-300"
                                onClick={() => {
                                  setRefundAmount(String(order.totalPrice || 0));
                                  setOpen({ type: "refund", id: order._id });
                                }}
                                title="Refund"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              {(order.orderStatus?.toLowerCase() === 'completed') && 
                               !order.paymentMethod?.toLowerCase().includes('cod') && 
                               !order.paymentMethod?.toLowerCase().includes('cash on delivery') &&
                               !order.paidOut && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-emerald-600 border-emerald-300"
                                onClick={() => {
                                  // Select this order and open payout dialog
                                  setSelectedOrders(new Set([order._id]));
                                  setOpen({ type: "payout", id: order._id });
                                }}
                                title="Process Payout"
                              >
                                <DollarSign className="w-3 h-3" />
                              </Button>
                              )}
                              {order.cancellationRequested ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-orange-600 border-orange-300"
                                  onClick={() => setOpen({ type: "cancellation-request", id: order._id })}
                                  title="Handle Cancellation Request"
                                >
                                  <AlertCircle className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    setCancelReason("");
                                    setOpen({ type: "cancel", id: order._id });
                                  }}
                                  title="Cancel"
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max((searchParams.page || 1) - 1, 1))}
                      className={searchParams.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(totalOrders / (searchParams.limit || 10)) }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => handlePageChange(page)} 
                        isActive={searchParams.page === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min((searchParams.page || 1) + 1, Math.ceil(totalOrders / (searchParams.limit || 10))))}
                      className={searchParams.page === Math.ceil(totalOrders / (searchParams.limit || 10)) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl bg-white border-stone-200 max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {open?.type === "view" && "Order Details"}
              {open?.type === "update-status" && "Update Order Status"}
              {open?.type === "cancel" && "Cancel Order"}
              {open?.type === "refund" && "Process Refund"}
              {open?.type === "bulk-action" && "Bulk Action"}
              {open?.type === "analytics" && "Order Analytics"}
              {open?.type === "shipping" && "Update Shipping"}
              {open?.type === "invoice" && "Generate Invoice"}
              {open?.type === "cancellation-request" && "Handle Cancellation Request"}
              {open?.type === "payout" && "Process PayMongo Payout"}
            </DialogTitle>
          </DialogHeader>

          {open?.type === "view" && selectedOrder && (
            <div className="space-y-4">
              {/* Awaiting Buyer Confirmation Notice */}
              {(['shipped', 'to_receive'].includes((selectedOrder.orderStatus || '').toLowerCase())) && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Package className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-amber-800">Order Shipped - Awaiting Buyer Confirmation</h3>
                      <p className="mt-1 text-sm text-amber-700">
                        This order has been shipped. The buyer will confirm receipt through the app.
                        Status will automatically change to "Completed" when buyer confirms.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedOrder.userID?.name || 'Unknown'}</div>
                    <div><span className="font-medium">Email:</span> {selectedOrder.userID?.email || '-'}</div>
                    <div><span className="font-medium">Phone:</span> {selectedOrder.userID?.phone || '-'}</div>
                  </div>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Order ID:</span> {selectedOrder._id}</div>
                    <div><span className="font-medium">Status:</span> {selectedOrder.orderStatus}</div>
                    <div><span className="font-medium">Total:</span> ₱{selectedOrder.totalPrice?.toLocaleString() || 0}</div>
                    <div><span className="font-medium">Date:</span> {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Payment Details</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Method:</span> {selectedOrder.paymentMethod || '-'}</div>
                  <div><span className="font-medium">Reference:</span> {selectedOrder.referenceNumber || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Billing Address</h3>
                  <div className="text-sm">
                    {selectedOrder.billingAddress ? (
                      <div>
                        <div>{selectedOrder.billingAddress.street}</div>
                        <div>{selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.state} {selectedOrder.billingAddress.postalCode}</div>
                        <div>{selectedOrder.billingAddress.country}</div>
                      </div>
                    ) : '-'}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Shipping Address</h3>
                  <div className="text-sm">
                    {selectedOrder.shippingAddress ? (
                      <div>
                        <div>{selectedOrder.shippingAddress.street}</div>
                        <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</div>
                        <div>{selectedOrder.shippingAddress.country}</div>
                      </div>
                    ) : '-'}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Order Items</h3>
                <div className="text-sm">
                  {selectedOrder.items?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b pb-2">
                          <div>
                            <div className="font-medium">{item.productName || 'Product'}</div>
                            <div className="text-slate-500">Qty: {item.quantity || 1}</div>
                          </div>
                          <div className="font-medium">₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : 'No items'}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          )}

          {open?.type === "update-status" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="to_receive">To Receive (Awaiting Buyer)</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed (Buyer Confirmed)</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              
             
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "cancel" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-700">Are you sure you want to cancel this order?</p>
              <div>
                <Label htmlFor="cancel-reason">Cancellation Reason</Label>
                <Textarea 
                  id="cancel-reason" 
                  rows={3}
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                />
              </div>
             
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelOrder}
                  disabled={cancelOrderMutation.isPending}
                >
                  {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "refund" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-700">Process a refund for this order.</p>
              <div>
                <Label htmlFor="refund-amount">Refund Amount (₱)</Label>
                <Input 
                  id="refund-amount" 
                  type="number"
                  step="0.01"
                  value={refundAmount} 
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs text-green-800">✓ Refund will be processed to the original payment method.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleRefund}
                  disabled={refundMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
                </Button>
              </div>
            </div>
          )}

        
         

          {open?.type === "invoice" && selectedOrder && (
            <div className="space-y-4">
              <div className="border-2 border-slate-200 rounded-lg p-6 bg-white">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
                  <p className="text-sm text-slate-500">Order #{selectedOrder._id?.slice(0, 8)}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Bill To:</h3>
                    <div className="text-sm text-slate-600">
                      <div>{selectedOrder.userID?.name || 'Unknown'}</div>
                      <div>{selectedOrder.userID?.email || '-'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Invoice Details:</h3>
                    <div className="text-sm text-slate-600">
                      <div>Date: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : '-'}</div>
                      <div>Status: {selectedOrder.orderStatus}</div>
                    </div>
                  </div>
                </div>

                <table className="w-full mb-6">
                  <thead className="border-b-2 border-slate-300">
                    <tr>
                      <th className="text-left py-2 text-sm font-semibold">Item</th>
                      <th className="text-right py-2 text-sm font-semibold">Qty</th>
                      <th className="text-right py-2 text-sm font-semibold">Price</th>
                      <th className="text-right py-2 text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="py-2 text-sm">{item.productName || 'Product'}</td>
                        <td className="text-right py-2 text-sm">{item.quantity || 1}</td>
                        <td className="text-right py-2 text-sm">₱{(item.price || 0).toLocaleString()}</td>
                        <td className="text-right py-2 text-sm">₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="text-right py-2 text-sm font-semibold">Total:</td>
                      <td className="text-right py-2 text-lg font-bold">₱{selectedOrder.totalPrice?.toLocaleString() || 0}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center text-xs text-slate-500">
                  Thank you for your business!
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
                <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}

          {open?.type === "bulk-action" && (
            <div className="space-y-4">
              <p className="text-sm">Apply an action to {selectedOrders.size} selected order(s).</p>
              <div>
                <Label htmlFor="bulk-action-select">Select Action</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an action..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="update_status">Update Status</SelectItem>
                    <SelectItem value="add_tracking">Add Tracking</SelectItem>
                    <SelectItem value="process_payout" disabled={!import.meta.env.VITE_PAYMONGO_PUBLIC_KEY}>
                      Process Seller Payout (PayMongo)
                      {!import.meta.env.VITE_PAYMONGO_PUBLIC_KEY && ' - Not configured'}
                    </SelectItem>
                    <SelectItem value="export">Export Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-800">This action will affect {selectedOrders.size} order(s). Please proceed with caution.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkActionMutation.isPending}
                >
                  {bulkActionMutation.isPending ? 'Processing...' : 'Apply Action'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Total Revenue</h3>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">₱{stats.revenue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">All time</div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Avg Order Value</h3>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">₱{stats.avgOrderValue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">Per order</div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Success Rate</h3>
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Paid orders</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Status Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Paid</span>
                      <span className="font-medium">{stats.paid} orders</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600" 
                        style={{ width: `${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pending</span>
                      <span className="font-medium">{stats.pending} orders</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600" 
                        style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cancelled</span>
                      <span className="font-medium">{stats.cancelled} orders</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-600" 
                        style={{ width: `${stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Methods</h3>
                <div className="space-y-2">
                  {(() => {
                    const methodCounts: Record<string, number> = {};
                    orders.forEach(o => {
                      const method = o.paymentMethod || 'Unknown';
                      methodCounts[method] = (methodCounts[method] || 0) + 1;
                    });
                    return Object.entries(methodCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([method, count]) => (
                        <div key={method} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700">{method}</span>
                          </div>
                          <Badge variant="secondary">{count} orders</Badge>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          )}

          {open?.type === "cancellation-request" && selectedOrder && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Cancellation Request</h3>
                </div>
                <p className="text-orange-700 text-sm">
                  Customer <strong>{selectedOrder.userID?.name || 'Unknown'}</strong> has requested to cancel this order.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Order Details</Label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-md text-sm">
                    <div><span className="font-medium">Order ID:</span> {selectedOrder._id}</div>
                    <div><span className="font-medium">Total Amount:</span> ₱{selectedOrder.totalPrice?.toLocaleString() || 0}</div>
                    <div><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod || 'Unknown'}</div>
                    <div><span className="font-medium">Order Date:</span> {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : '-'}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Cancellation Reason</Label>
                  <div className="mt-1 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-orange-800 text-sm">
                      {selectedOrder.cancellationReason || 'No reason provided by customer'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Requested At</Label>
                  <div className="mt-1 text-sm text-slate-600">
                    {selectedOrder.cancellationRequestedAt ? new Date(selectedOrder.cancellationRequestedAt).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                   <strong>Approve:</strong> Order will be cancelled and customer will be notified.<br/>
                  <strong>Deny:</strong> Order will continue processing and customer will be notified of the denial.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  variant="outline"
                  className="border-gray-400 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleCancellationRequest(false)}
                  disabled={cancellationRequestMutation.isPending}
                >
                  {cancellationRequestMutation.isPending ? 'Processing...' : 'Deny Request'}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleCancellationRequest(true)}
                  disabled={cancellationRequestMutation.isPending}
                >
                  {cancellationRequestMutation.isPending ? 'Processing...' : 'Approve Cancellation'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "payout" && (
            <div className="space-y-4">
              
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    
                 
                  
                </div>
              </div>

              {/* Selected Orders Summary */}
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Selected Orders</h3>
                <div className="space-y-2">
                  {(() => {
                    const selectedCompletedOrders = orders.filter(o => selectedOrders.has(o._id) && o.orderStatus?.toLowerCase() === 'completed');
                    const eligibleOrders = selectedCompletedOrders.filter(o => 
                      !o.paymentMethod?.toLowerCase().includes('cod') && 
                      !o.paymentMethod?.toLowerCase().includes('cash on delivery')
                    );
                    const codOrders = selectedCompletedOrders.filter(o => 
                      o.paymentMethod?.toLowerCase().includes('cod') || 
                      o.paymentMethod?.toLowerCase().includes('cash on delivery')
                    );
                    
                    if (selectedCompletedOrders.length === 0) {
                      return (
                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          No completed orders selected. Please select completed orders first.
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-2">
                        {eligibleOrders.map(order => (
                          <div key={order._id} className="text-sm flex justify-between items-center">
                            <span className="font-medium">Order #{order._id.slice(0, 8)}</span>
                            <span className="font-semibold">₱{(order.totalPrice || 0).toLocaleString()}</span>
                          </div>
                        ))}
                        {codOrders.length > 0 && (
                          <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                            {codOrders.length} COD order(s) excluded from payout
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="flex justify-between text-lg font-bold text-emerald-700">
                    <span>Total Payout Amount:</span>
                    <span>₱{payoutAmount}</span>
                  </div>
               
                </div>
              </div>

              {/* PayMongo Integration Info */}
             
                
                <div className="space-y-3">
                  {!import.meta.env.VITE_PAYMONGO_PUBLIC_KEY ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">PayMongo Not Configured</h4>
                          <p className="text-xs text-yellow-700 mt-1">
                            Please set VITE_PAYMONGO_PUBLIC_KEY and VITE_PAYMONGO_SECRET_KEY in your .env file to enable automated payouts.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                    
                      
                    </div>
                  )}
                </div>
            
              {/* Seller Information */}
              {loadingSellerInfo && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    <span className="text-sm text-slate-600">Loading seller information...</span>
                  </div>
                </div>
              )}

              {sellerInfo && !loadingSellerInfo && (
                <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Seller Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700">{sellerInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-slate-600">GCash: {sellerInfo.gcashName || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-slate-600">{sellerInfo.gcashNumber || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* GCash Details Form */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">GCash Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="gcash-name">GCash Name</Label>
                    <Input 
                      id="gcash-name"
                      value={gcashName}
                      onChange={(e) => setGcashName(e.target.value)}
                      placeholder="Seller's name on GCash"
                      className={sellerInfo?.gcashName ? 'bg-slate-50' : ''}
                    />
                    {sellerInfo?.gcashName && (
                      <p className="text-xs text-slate-500 mt-1">Auto-filled from seller profile</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gcash-number">GCash Number</Label>
                    <Input 
                      id="gcash-number"
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                      placeholder="09XX XXX XXXX"
                      className={sellerInfo?.gcashNumber ? 'bg-slate-50' : ''}
                    />
                    {sellerInfo?.gcashNumber && (
                      <p className="text-xs text-slate-500 mt-1">Auto-filled from seller profile</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="payout-notes">Notes (Optional)</Label>
                    <Textarea 
                      id="payout-notes"
                      rows={2}
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      placeholder="Transaction reference or additional notes..."
                    />
                  </div>
                </div>
              </div>

             

              {payoutUrl && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-800">GCash Authorization Required</p>
                      <p className="text-xs text-emerald-700">Click the button to open GCash authorization</p>
                    </div>
                    <Button 
                      onClick={() => window.open(payoutUrl, '_blank')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                    >
                      Open GCash
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                
                <Button 
                  onClick={handleProcessPayout}
                  disabled={payoutMutation.isPending || !gcashNumber || !gcashName || !import.meta.env.VITE_PAYMONGO_PUBLIC_KEY}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {payoutMutation.isPending ? 'Processing...' : 'Process Payout'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}