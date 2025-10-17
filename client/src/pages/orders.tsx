import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";

export default function Orders() {
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/orders?page=1&limit=50"], 
    queryFn: () => getJson<any>("/orders?page=1&limit=50") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const rows: any[] = data?.success && Array.isArray(data.data) ? data.data : [];
  
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-stone-500">Loading orders...</div>
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
            <CardTitle className="text-lg font-semibold text-stone-900">Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Error loading orders: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <Card className="border-stone-200">
        <CardHeader className="border-b border-stone-200">
          <CardTitle className="text-lg font-semibold text-stone-900">Orders ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Billing Address</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-stone-500">No orders found</td>
                  </tr>
                ) : (
                  rows.map((order, idx) => (
                    <tr key={order._id || order.id || idx} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">
                        {order._id || order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {order.userID?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const raw = (order.payment_status || order.paymentStatus || order.status || order.order_status || order.orderStatus || 'pending');
                          const s = String(raw).toLowerCase();
                          const pm = String(order.paymentMethod || '').toLowerCase();
                          const label = s; // No need to transform since we now use 'paid' directly
                          const cls = label === 'paid' ? 'bg-green-100 text-green-800' : label === 'pending' ? 'bg-yellow-100 text-yellow-800' : label === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
                          return (
                            <Badge variant="secondary" className={`${cls} hover:opacity-80`}>
                              {label}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-semibold">
                        ₱{order.totalPrice?.toLocaleString() || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {order.paymentMethod || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">
                        {order.referenceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {order.billingAddress ? 
                          `${order.billingAddress.street}, ${order.billingAddress.city}` : 
                          order.billing_addresses?.[0] ? 
                            `${order.billing_addresses[0].street}, ${order.billing_addresses[0].city}` : 
                            "-"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
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
  );
}


