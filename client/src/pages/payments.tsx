import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
import { useMemo, useState, useEffect } from "react";

export default function Payments() {
  // Since there's no direct payments endpoint, we'll get payment data from orders
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/orders?page=1&limit=50"], 
    queryFn: () => getJson<any>("/orders?page=1&limit=50") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const orders: any[] = data?.success && Array.isArray(data.data) ? data.data : [];

  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);
  const selectedOrder = useMemo(() => orders.find(o => o._id === openReceiptId), [orders, openReceiptId]);

  // Fetch user's shipping_fee if available
  const [fetchedShippingFee, setFetchedShippingFee] = useState<number | null>(null);
  useEffect(() => {
    const loadShippingFee = async () => {
      try {
        setFetchedShippingFee(null);
        const userId = selectedOrder?.userID?._id;
        if (!userId) return;
        const resp = await getJson<any>(`/users/${userId}`);
        const fee = resp?.data?.shipping_fee ?? resp?.shipping_fee;
        if (typeof fee === 'number') setFetchedShippingFee(fee);
      } catch {
        // ignore and fallback to computed
      }
    };
    if (selectedOrder) {
      loadShippingFee();
    } else {
      setFetchedShippingFee(null);
    }
  }, [selectedOrder]);

  // Precompute totals using original product prices
  const receiptTotals = useMemo(() => {
    // Sum original product price (products.price) per item; fallback to item.price
    const items: any[] = (selectedOrder?.items || []) as any[];
    const itemsSubtotal = items.reduce((sum, it) => {
      const unitPrice = Number((it.products?.price ?? it.price) || 0);
      const qty = Number(it.quantity || 0);
      return sum + unitPrice * qty;
    }, 0);

    const fallbackBackendTotal = Number((selectedOrder?.orderTotal?.total ?? (selectedOrder?.totalPrice || 0)) as number);
    const computedShipping = Math.max(fallbackBackendTotal - itemsSubtotal, 0);
    const shippingFee = fetchedShippingFee ?? computedShipping;

    const total = Math.max(itemsSubtotal + shippingFee, 0);

    return { subtotal: itemsSubtotal, total, shippingFee };
  }, [selectedOrder, fetchedShippingFee]);

  // Extract unique payment methods and their counts
  const paymentMethods = orders.reduce((acc, order) => {
    const method = order.paymentMethod || 'Unknown';
    if (!acc[method]) {
      acc[method] = { method, count: 0, totalAmount: 0 };
    }
    acc[method].count += 1;
    acc[method].totalAmount += order.totalPrice || 0;
    return acc;
  }, {} as Record<string, { method: string; count: number; totalAmount: number }>);
  
  const paymentRows: Array<{ method: string; count: number; totalAmount: number }> = Object.values(paymentMethods) as Array<{ method: string; count: number; totalAmount: number }>;

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-stone-500">Loading payment data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Error loading payment data: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="grid grid-cols-1 gap-6">
        
         
                  
            
        

        {/* Detailed Payment Logs */}
        <Card className="border-white-200">
          <CardHeader className="border-b border-black-200">
            <CardTitle className="text-lg font-semibold text-black-900">Payment Logs ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-stone-500">No orders found</td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id} className="hover:bg-white-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">{o._id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{o.userID?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              (o.paymentMethod || '').toLowerCase().includes('gcash') ? 'bg-green-100 text-green-800' :
                              (o.paymentMethod || '').toLowerCase().includes('paypal') ? 'bg-blue-100 text-blue-800' :
                              (o.paymentMethod || '').toLowerCase().includes('cod') ? 'bg-yellow-100 text-yellow-800' :
                              (o.paymentMethod || '').toLowerCase().includes('card') ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {o.paymentMethod || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">{o.orderStatus || 'pending'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-semibold">₱{Number(o.totalPrice || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button size="sm" variant="outline" onClick={() => setOpenReceiptId(o._id)}>View Receipt</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={!!openReceiptId} onOpenChange={(open) => !open && setOpenReceiptId(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-6 p-1">
              <div>
                <div className="text-sm text-black-500">Order ID</div>
                <div className="text-sm font-mono text-black-900">{selectedOrder._id}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-stone-500">Buyer</div>
                  <div className="text-sm text-stone-900">{selectedOrder.userID?.name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-stone-500">Payment Method</div>
                  <div className="text-sm text-stone-900">{selectedOrder.paymentMethod || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-stone-500">Status</div>
                  <div className="text-sm text-stone-900">{selectedOrder.orderStatus || 'pending'}</div>
                </div>
                <div>
                  <div className="text-sm text-stone-500">Order Date</div>
                  <div className="text-sm text-stone-900">{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-stone-500 mb-2">Items</div>
                <div className="overflow-x-auto border border-stone-200 rounded-md">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-normal text-stone-500">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-normal text-stone-500">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-normal text-stone-500">Price</th>
                        
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-stone-200">
                      {(selectedOrder.items || []).map((it: any) => {
                        const unitPrice = Number((it.products?.price ?? it.price) || 0);
                        const qty = Number(it.quantity || 0);
                        return (
                          <tr key={it._id}>
                            <td className="px-4 py-2 text-sm text-stone-900">{it.productName || it.productID}</td>
                            <td className="px-4 py-2 text-sm text-stone-900">{qty}</td>
                            <td className="px-4 py-2 text-sm text-stone-900">₱{unitPrice.toLocaleString()}</td>
                          
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-black-500">Subtotal</div>
                  <div className="text-sm text-black-900">₱{receiptTotals.subtotal.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-black-500">Shipping Fee</div>
                  <div className="text-sm text-black-900">₱{receiptTotals.shippingFee.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-black-500">Total</div>
                  <div className="text-sm font-semibold text-black-900">₱{receiptTotals.total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}


