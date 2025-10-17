import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useMemo, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function Payments() {
  // Since there's no direct payments endpoint, we'll get payment data from orders
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/orders?page=1&limit=50"], 
    queryFn: () => getJson<any>("/orders?page=1&limit=50") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const orders: any[] = data?.success && Array.isArray(data.data) ? data.data : [];

  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);
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

  // Fetch seller payout data
  const { data: sellersData } = useQuery({ 
    queryKey: ["/sellers"], 
    queryFn: () => getJson<any>("/sellers") 
  });
  
  const sellers: any[] = sellersData?.success && Array.isArray(sellersData.data) ? sellersData.data : [];

  // Calculate pending payouts per seller
  const pendingPayouts = useMemo(() => {
    const payouts: any[] = [];
    
    sellers.forEach(seller => {
      const sellerOrders = orders.filter(order => 
        order.sellerId === seller._id || order.sellerId === seller.id
      );
      
      const paidOrders = sellerOrders.filter(order => {
        const status = (order.orderStatus || 'pending').toLowerCase();
        const pm = (order.paymentMethod || '').toLowerCase();
        return status === 'processing' && (pm === 'gcash' || pm === 'paypal') ||
               status === 'shipped' || status === 'delivered';
      });
      
      const totalPending = paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const platformFee = totalPending * 0.05; // 5% platform fee
      const sellerAmount = totalPending - platformFee;
      
      if (sellerAmount > 0) {
        payouts.push({
          sellerId: seller._id || seller.id,
          sellerName: seller.businessName || seller.name || 'Unknown',
          gcashName: seller.payoutInfo?.gcashName || seller.payoutinfo?.gcashName || '',
          gcashNumber: seller.payoutInfo?.gcashNumber || seller.payoutinfo?.gcashNumber || '',
          totalPending,
          platformFee,
          sellerAmount,
          orderCount: paidOrders.length
        });
      }
    });
    
    return payouts;
  }, [orders, sellers]);

  const handleSettlePayout = async (payout: any) => {
    setIsSettling(true);
    try {
      const res = await fetch(apiUrl('/payouts/settle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: payout.sellerId,
          amount: payout.sellerAmount,
          gcashName: payout.gcashName,
          gcashNumber: payout.gcashNumber,
          orderIds: orders
            .filter(o => (o.sellerId === payout.sellerId) && 
              (['processing', 'shipped', 'delivered'].includes((o.orderStatus || '').toLowerCase())) &&
              (['gcash', 'paypal'].includes((o.paymentMethod || '').toLowerCase())))
            .map(o => o._id || o.id)
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || 'Settlement failed');
      }
      
      toast({ title: 'Success', description: `Payout of ₱${payout.sellerAmount.toLocaleString()} sent to ${payout.sellerName}` });
      // Refresh data
      window.location.reload();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Settlement failed', variant: 'destructive' });
    } finally {
      setIsSettling(false);
    }
  };

  // Precompute totals using original product prices
  const receiptTotals = useMemo(() => {
    // Sum original product price (products.price) per item; fallback to item.price
    const items: any[] = (selectedOrder?.items || []) as any[];
    const itemsSubtotal = items.reduce((sum, it) => {
      const unitPrice = Number((it.products?.price ?? it.price) || 0);
      const qty = Number(it.quantity || 0);
      return sum + unitPrice * qty;
    }, 0);

    // Prefer shipping recorded on the order itself
    const orderShipping = Number(
      (selectedOrder?.orderTotal?.shipping ??
        selectedOrder?.shippingFee ??
        selectedOrder?.shipping_fee ?? 0) as number
    );

    const backendTotal = Number(
      (selectedOrder?.orderTotal?.total ?? selectedOrder?.totalPrice ?? 0) as number
    );

    // Compute difference-based shipping only if order did not include a shipping field
    const computedShipping = Math.max(backendTotal - itemsSubtotal, 0);
    const effectiveShipping = Number.isFinite(orderShipping) && orderShipping >= 0
      ? orderShipping
      : (fetchedShippingFee ?? computedShipping);

    const total = Math.max(itemsSubtotal + (effectiveShipping || 0), 0);

    return { subtotal: itemsSubtotal, total, shippingFee: effectiveShipping || 0 };
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
            <CardTitle className="text-lg font-semibold text-black-900">Payment History ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-stone-500">No orders found</td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">{o.referenceNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                          {(() => {
                            const raw = (o.payment_status || o.paymentStatus || o.status || o.order_status || o.orderStatus || 'pending');
                            const s = String(raw).toLowerCase();
                            const pm = String(o.paymentMethod || '').toLowerCase();
                            const label = s; // No need to transform since we now use 'paid' directly
                            return label;
                          })()}
                        </td>
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
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="tracking-wide">Online Receipt</span>
              {(() => {
                const raw = (selectedOrder?.payment_status || selectedOrder?.paymentStatus || selectedOrder?.status || selectedOrder?.order_status || selectedOrder?.orderStatus || 'pending');
                const s = String(raw).toLowerCase();
                if (s === 'paid') {
                  return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">PAID</span>;
                }
                return null;
              })()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-6 p-1">
              {/* Header: Bill To / Ship To / Meta */}
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-semibold text-stone-800 mb-1">Bill To</div>
                  {(() => {
                    const b = selectedOrder.billingAddress || (selectedOrder.billing_addresses?.[0] ?? null);
                    if (!b) return <div className="text-stone-500">-</div>;
                    return (
                      <div className="space-y-0.5 text-stone-800">
                        {b.street && <div>{b.street}</div>}
                        {(b.city || b.state || b.postalCode) && (
                          <div>{[b.city, b.state, b.postalCode].filter(Boolean).join(', ')}</div>
                        )}
                        {b.country && <div>{b.country}</div>}
                        {b.phone && <div className="text-stone-500">Phone: {b.phone}</div>}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="font-semibold text-stone-800 mb-1">Ship To</div>
                  {(() => {
                    const s = selectedOrder.shippingAddress || (selectedOrder.shipping_addresses?.[0] ?? null);
                    if (!s) return <div className="text-stone-500">-</div>;
                    return (
                      <div className="space-y-0.5 text-stone-800">
                        {s.street && <div>{s.street}</div>}
                        {(s.city || s.state || s.postalCode) && (
                          <div>{[s.city, s.state, s.postalCode].filter(Boolean).join(', ')}</div>
                        )}
                        {s.country && <div>{s.country}</div>}
                        {s.phone && <div className="text-stone-500">Phone: {s.phone}</div>}
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Receipt #</span>
                    <span className="font-mono text-stone-900">{selectedOrder.referenceNumber || selectedOrder._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Receipt Date</span>
                    <span className="text-stone-900">{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Payment</span>
                    <span className="text-stone-900">{selectedOrder.paymentMethod || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Items Table */}
              <div className="overflow-x-auto border border-stone-200 rounded-md">
                <table className="w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-stone-500">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-stone-500">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-stone-500">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-stone-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-200">
                    {(selectedOrder.items || []).map((it: any) => {
                      const unitPrice = Number((it.products?.price ?? it.price) || 0);
                      const qty = Number(it.quantity || 0);
                      const amount = unitPrice * qty;
                      return (
                        <tr key={it._id}>
                          <td className="px-4 py-2 text-sm text-stone-900">{qty}</td>
                          <td className="px-4 py-2 text-sm text-stone-900">{it.productName || it.productID}</td>
                          <td className="px-4 py-2 text-sm text-stone-900 text-right">₱{unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-stone-900 text-right">₱{amount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm">
                  <div className="font-semibold text-stone-800 mb-2">Payment Instruction</div>
                  <div className="space-y-1 text-stone-700">
                    <div>Paid via: {selectedOrder.paymentMethod || 'Unknown'}</div>
                    {selectedOrder.referenceNumber && (
                      <div className="font-mono">Ref: {selectedOrder.referenceNumber}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>₱{receiptTotals.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-stone-500">Shipping</span><span>₱{receiptTotals.shippingFee.toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold text-stone-900 mt-1"><span>Total</span><span>₱{receiptTotals.total.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-stone-500">
                Payment confirmed. Please contact support for any questions regarding this receipt.
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}


