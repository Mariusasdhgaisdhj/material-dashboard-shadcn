import { Card, CardContent } from "@/components/ui/card";
import { MiniChart } from "./mini-chart";
import { statsData, ordersOverview } from "@/lib/data";
import { Bell, ShoppingCart, CreditCard, Plus, Package, Users, DollarSign } from "lucide-react";

const iconMap = {
  bell: Bell,
  "shopping-cart": ShoppingCart,
  "credit-card": CreditCard,
  plus: Plus,
  package: Package,
};

interface StatsGridProps {
  ordersCount?: number;
  productsCount?: number;
  usersCount?: number;
  totalRevenue?: number;
  recentOrders?: any[];
  products?: any;
  selectedYear?: string;
}

export function StatsGrid({ ordersCount = 0, productsCount = 0, usersCount = 0, totalRevenue = 0, recentOrders = [], products, selectedYear }: StatsGridProps) {
  // Generate real weekly data for mini charts
  const generateWeeklyData = (data: any[], dateField: string, valueField?: string) => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = daysOfWeek.map(day => ({ day, count: 0 }));
    
    data.forEach((item: any) => {
      const date = new Date(item[dateField] || item.createdAt);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyData[dayIndex].count += valueField ? (item[valueField] || 0) : 1;
      }
    });
    
    return weeklyData.map(d => d.count);
  };

  // Get real data from products prop
  const productsData = products?.success && Array.isArray(products.data) ? products.data : [];
  
  // Generate real weekly data
  const ordersWeeklyData = generateWeeklyData(recentOrders, 'orderDate');
  const productsWeeklyData = generateWeeklyData(productsData, 'createdAt');
  const usersWeeklyData = generateWeeklyData(recentOrders, 'orderDate'); // Using orders as proxy for user activity
  const revenueWeeklyData = generateWeeklyData(recentOrders, 'orderDate', 'totalPrice');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Orders */}
      <Card className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
              Total Orders
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Real-time order count
              {selectedYear && <span className="ml-1 text-blue-600">({selectedYear})</span>}
            </p>
          </div>
          
          <div className="flex-1 mb-4">
            <div className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              {ordersCount}
            </div>
            <MiniChart 
              data={ordersWeeklyData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              activeColor="#3b82f6"
            />
          </div>

          <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2" />
            Live data
          </div>
        </CardContent>
      </Card>

      {/* Total Products */}
      <Card className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
              Total Products
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Products in catalog
              {selectedYear && <span className="ml-1 text-blue-600">({selectedYear})</span>}
            </p>
          </div>
          
          <div className="flex-1 mb-4">
            <div className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              {productsCount}
            </div>
            <MiniChart 
              data={productsWeeklyData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              activeColor="#8b5cf6"
            />
          </div>

          <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2" />
            Live data
          </div>
        </CardContent>
      </Card>

      {/* Business Owners */}
      <Card className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
              Business Owners
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Registered businesses
              {selectedYear && <span className="ml-1 text-blue-600">({selectedYear})</span>}
            </p>
          </div>
          
          <div className="flex-1 mb-4">
            <div className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              {usersCount}
            </div>
            <MiniChart 
              data={usersWeeklyData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              activeColor="#f59e0b"
            />
          </div>

          <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2" />
            Live data
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
              Total Revenue
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              From all orders
              {selectedYear && <span className="ml-1 text-blue-600">({selectedYear})</span>}
            </p>
          </div>
          
          <div className="flex-1 mb-4">
            <div className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              ₱{totalRevenue.toLocaleString()}
            </div>
            <MiniChart 
              data={revenueWeeklyData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              activeColor="#22c55e"
            />
          </div>

          <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2" />
            Live data
          </div>
        </CardContent>
      </Card>

      {/* Products Overview Card */}
      <Card className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
              Products Overview
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Latest products from database
            </p>
          </div>
          
          <div className="flex-1 mb-4">
            <div className="space-y-4">
              {products?.success && Array.isArray(products.data) && products.data.length > 0 ? 
                products.data.slice(0, 3).map((product: any, index: number) => {
                  const iconMap = {
                    'available': { icon: 'package', color: 'text-green-500' },
                    'out_of_stock': { icon: 'shopping-cart', color: 'text-red-500' },
                    'pending': { icon: 'bell', color: 'text-yellow-500' }
                  };
                  const status = product.status || product.availability || 'available';
                  const iconInfo = iconMap[status as keyof typeof iconMap] || iconMap.available;
                  const Icon = iconInfo.icon === 'package' ? Package : 
                               iconInfo.icon === 'shopping-cart' ? ShoppingCart : Bell;
                  
                  return (
                    <div key={product.id || index} className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <Icon className={`${iconInfo.color} w-4 h-4`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                          {product.name || product.productName || 'Product Name'}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                          Price: ₱{product.price?.toLocaleString() || product.cost?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                          Category: {product.category || product.categoryName || 'Uncategorized'} • Stock: {product.stock || product.quantity || 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-stone-500 dark:text-stone-400 text-sm">
                    No products found
                  </div>
                )
              }
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full font-normal">
              Live data
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
