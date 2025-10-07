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
  const normalize = (res: any) => (res?.success ? (Array.isArray(res.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : [])) : []);
  const usersArr: any[] = normalize(users);
  const productsArr: any[] = normalize(products);
  const ordersArr: any[] = normalize(orders);

  // Calculate business data from real data (sellers only)
  const businessData = usersArr
    .filter((u: any) => u.role === 'seller' || !!u.business_name)
    .map((user: any) => {
      const currentUserId = user.id || user._id;
      const userProducts = productsArr.filter((p: any) => {
        const pid = p.id || p._id;
        const prodSeller = (
          p.seller_id ||
          p.sellerId?._id ||
          p.sellerId ||
          p.users?.id ||
          p.users?._id ||
          p.seller?.id ||
          p.seller?._id
        );
        return prodSeller === currentUserId;
      });
      // Revenue: sum order_items amounts for items whose product seller matches this user
      const revenue = ordersArr.reduce((sum: number, order: any) => {
        const items: any[] = Array.isArray(order.order_items) ? order.order_items : [];
        const sellerItemsTotal = items.reduce((sub: number, it: any) => {
          const itemSellerId = (
            it.products?.seller_id ||
            it.products?.sellerId?._id ||
            it.products?.sellerId ||
            it.products?.users?.id ||
            it.products?.users?._id ||
            it.seller_id ||
            it.sellerId
          );
          if (itemSellerId !== currentUserId) return sub;
          const qty = Number(it.quantity || 1);
          const price = Number(it.price || it.products?.price || 0);
          return sub + qty * price;
        }, 0);
        return sum + sellerItemsTotal;
      }, 0);
      const stockCount = userProducts.length;
      return {
        id: user.id,
        name: user.business_name || user.businessName || 'Business',
        owner: (user.firstname && user.lastname) ? `${user.firstname} ${user.lastname}` : (user.name || 'Owner'),
        revenue,
        stockCount,
        products: userProducts.map((p: any) => ({ id: p.id || p._id, name: p.name, price: p.price })),
        completion: Math.min(100, Math.floor((stockCount / 10) * 100))
      };
    })
    .sort((a: any, b: any) => b.stockCount - a.stockCount)
    .slice(0, 5);

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
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-blue-100">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-normal text-gray-900">{business.name}</span>
                        {Array.isArray(business.products) && business.products.length > 0 && (
                          <span className="text-xs text-gray-500 max-w-[320px] truncate">
                            {business.products.slice(0,3).map((p: any) => p.name).filter(Boolean).join(', ')}
                            {business.products.length > 3 ? ` +${business.products.length - 3} more` : ''}
                          </span>
                        )}
                      </div>
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
