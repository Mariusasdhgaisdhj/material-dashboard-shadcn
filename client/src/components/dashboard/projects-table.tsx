import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreVertical, 
  Palette, 
  TrendingUp, 
  Bug, 
  Smartphone, 
  Tag, 
  ShoppingBag 
} from "lucide-react";
import { projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";

const getProjectIcon = (iconName: string) => {
  const iconProps = { className: "w-4 h-4" };
  
  switch (iconName) {
    case 'palette':
      return <Palette {...iconProps} />;
    case 'chart-line':
      return <TrendingUp {...iconProps} />;
    case 'bug':
      return <Bug {...iconProps} />;
    case 'smartphone':
      return <Smartphone {...iconProps} />;
    case 'tag':
      return <Tag {...iconProps} />;
    case 'shopping-bag':
      return <ShoppingBag {...iconProps} />;
    default:
      return <Palette {...iconProps} />;
  }
};

interface ProjectsTableProps {
  users?: any;
  products?: any;
  orders?: any;
}

export function ProjectsTable({ users, products, orders }: ProjectsTableProps) {
  // Calculate business data from real data
  const businessData = users?.success && Array.isArray(users.data) ? 
    users.data.slice(0, 5).map((user: any) => {
      const userProducts = products?.success && Array.isArray(products.data) ? 
        products.data.filter((product: any) => product.userId === user.id) : [];
      const userOrders = orders?.success && Array.isArray(orders.data) ? 
        orders.data.filter((order: any) => order.userId === user.id) : [];
      const revenue = userOrders.reduce((sum: any, order: any) => sum + (order.totalPrice || 0), 0);
      const stockCount = userProducts.length;
      
      return {
        id: user.id,
        name: user.name || "Business Owner",
        owner: user.name || "Owner",
        revenue: revenue,
        stockCount: stockCount,
        completion: Math.min(100, Math.floor((stockCount / 10) * 100)) // Simulate completion based on stock
      };
    }) : [];

  return (
    <Card className="border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Top Businesses</CardTitle>
            <div className="text-sm text-gray-500 flex items-center mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              Business owners with most products
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                  Products
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessData.length > 0 ? businessData.map((business: any) => (
                <tr key={business.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-blue-100">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-normal text-gray-900">{business.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8 border-2 border-white">
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          {business.owner.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{business.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{business.stockCount} items</span>
                      <Progress 
                        value={business.completion} 
                        className="w-32 h-2"
                      />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No business data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
