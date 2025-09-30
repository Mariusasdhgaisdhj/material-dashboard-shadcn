import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";

export default function Payments() {
  // Since there's no direct payments endpoint, we'll get payment data from orders
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/orders?page=1&limit=50"], 
    queryFn: () => getJson<any>("/orders?page=1&limit=50") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const orders: any[] = data?.success && Array.isArray(data.data) ? data.data : [];
  
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
  
  const paymentRows = Object.values(paymentMethods);
  
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
      <Card className="border-stone-200">
        <CardHeader className="border-b border-stone-200">
          <CardTitle className="text-lg font-semibold text-stone-900">Payment Methods ({paymentRows.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Orders Count</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Average Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {paymentRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-stone-500">No payment data found</td>
                  </tr>
                ) : (
                  paymentRows.map((payment, idx) => (
                    <tr key={payment.method || idx} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-medium">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            payment.method.toLowerCase().includes('gcash') ? 'bg-green-100 text-green-800' :
                            payment.method.toLowerCase().includes('paypal') ? 'bg-blue-100 text-blue-800' :
                            payment.method.toLowerCase().includes('card') ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          } hover:opacity-80`}
                        >
                          {payment.method}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {payment.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-semibold">
                        ₱{payment.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        ₱{Math.round(payment.totalAmount / payment.count).toLocaleString()}
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


