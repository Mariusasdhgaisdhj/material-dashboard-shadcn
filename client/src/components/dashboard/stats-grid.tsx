import { Card, CardContent } from "@/components/ui/card";
import { MiniChart } from "./mini-chart";
import { statsData, ordersOverview } from "@/lib/data";
import { Bell, ShoppingCart, CreditCard, Plus, Package, Users, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
      {/* Total Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              
            </div>
            
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Orders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time order count
                {selectedYear && <span className="ml-1 text-blue-600 font-medium">({selectedYear})</span>}
              </p>
            </div>
            
            <div className="flex-1 mb-4">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {ordersCount.toLocaleString()}
              </div>
              <MiniChart 
                data={ordersWeeklyData} 
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                activeColor="#3b82f6"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
               
              </div>
              <Badge variant="secondary" className="text-xs">
                Weekly
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
             
            </div>
            
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Products
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products in catalog
                {selectedYear && <span className="ml-1 text-purple-600 font-medium">({selectedYear})</span>}
              </p>
            </div>
            
            <div className="flex-1 mb-4">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {productsCount.toLocaleString()}
              </div>
              <MiniChart 
                data={productsWeeklyData} 
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                activeColor="#8b5cf6"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                
              </div>
              <Badge variant="secondary" className="text-xs">
                Weekly
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Owners */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
               
              </div>
            </div>
            
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Owners
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registered businesses
                {selectedYear && <span className="ml-1 text-amber-600 font-medium">({selectedYear})</span>}
              </p>
            </div>
            
            <div className="flex-1 mb-4">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {usersCount.toLocaleString()}
              </div>
              <MiniChart 
                data={usersWeeklyData} 
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                activeColor="#f59e0b"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              
              </div>
              <Badge variant="secondary" className="text-xs">
                Weekly
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
              
              </div>
            </div>
            
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Revenue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                From all orders
                {selectedYear && <span className="ml-1 text-emerald-600 font-medium">({selectedYear})</span>}
              </p>
            </div>
            
            <div className="flex-1 mb-4">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                ₱{totalRevenue.toLocaleString()}
              </div>
              <MiniChart 
                data={revenueWeeklyData} 
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                activeColor="#22c55e"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
               
              </div>
              <Badge variant="secondary" className="text-xs">
                Weekly
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Products Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="sm:col-span-2 lg:col-span-1 xl:col-span-1"
      >
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-400/20 to-gray-400/20 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6 flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Products Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest products from database
              </p>
            </div>
            
            <div className="flex-1 mb-4">
              <div className="space-y-3">
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
                      <motion.div 
                        key={product.id || index} 
                        className="flex items-start p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex-shrink-0 mr-3 p-2 bg-slate-100 dark:bg-slate-600 rounded-lg">
                          <Icon className={`${iconInfo.color} w-4 h-4`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {product.name || product.productName || 'Product Name'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            Price: ₱{product.price?.toLocaleString() || product.cost?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Category: {product.proCategoryId?.name || product.category || product.categoryName || 'Uncategorized'} • Stock: {product.stock || product.quantity || 'N/A'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-8">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No products found
                    </div>
                  )
                }
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                
              </div>
              <Badge variant="secondary" className="text-xs">
                Recent
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}