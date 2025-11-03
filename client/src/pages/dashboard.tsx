import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { ChartsShowcase } from "@/components/dashboard/charts-showcase";
import { ClockWidget } from "@/components/dashboard/clock-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniChart } from "@/components/dashboard/mini-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Building2,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import peopleBackground from "/images/material-persons.jpg";

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const { data: products, isLoading: productsLoading } = useQuery({ 
    queryKey: ["/products?page=1&limit=50"], 
    queryFn: () => getJson<any>("/products?page=1&limit=50") 
  });
  const { data: users, isLoading: usersLoading } = useQuery({ 
    queryKey: ["/users?page=1&limit=50"], 
    queryFn: () => getJson<any>("/users?page=1&limit=50") 
  });
  const { data: orders, isLoading: ordersLoading } = useQuery({ 
    queryKey: ["/orders?page=1&limit=50"], 
    queryFn: () => getJson<any>("/orders?page=1&limit=50") 
  });
  
  // Normalize arrays from backend: supports {data:[...]} and {data:{data:[...]}}
  const normalize = (res: any) => (res?.success ? (Array.isArray(res.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : [])) : []);
  const productsArr: any[] = normalize(products);
  const usersArr: any[] = normalize(users);
  const ordersArr: any[] = normalize(orders);

  // Filter data by selected year
  const filterByYear = (data: any[], dateField: string = 'createdAt') => {
    return data.filter((item: any) => {
      const date = new Date(item[dateField] || item.orderDate || item.created_at);
      return date.getFullYear() === parseInt(selectedYear);
    });
  };

  const filteredOrders = filterByYear(ordersArr, 'orderDate');
  const filteredUsers = filterByYear(usersArr, 'createdAt');
  const filteredProducts = filterByYear(productsArr, 'createdAt');

  const productsCount = filteredProducts.length;
  const ordersCount = filteredOrders.length;
  // Count business owners (sellers) for the selected year
  const sellersCount = filteredUsers.filter((u: any) => u.role === 'seller' || !!u.business_name).length;
  
  const isLoading = productsLoading || usersLoading || ordersLoading;
  
  // Calculate total revenue from filtered orders
  const totalRevenue = orders?.success && Array.isArray(orders.data) ? 
    filteredOrders.reduce((sum: any, order: any) => sum + (order.totalPrice || 0), 0) : 0;

  // Generate year options (current year and previous 4 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar"
    >
      {/* Enhanced Header with Gradient Background */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-3 mb-2"
              >
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-slate-600 dark:text-slate-300 text-base sm:text-lg"
              >
                Welcome back! Here's what's happening with your business today.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-3 w-full lg:w-auto"
            >
              {/* Clock Widget */}
              <div className="w-full lg:w-auto">
                <ClockWidget />
              </div>
              
              {/* Year Selector */}
              <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-600 shadow-sm w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Year:</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-20 sm:w-24 border-0 bg-transparent font-semibold text-blue-600 dark:text-blue-400">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="mb-2">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="mb-4">
                    <Skeleton className="h-8 w-16 mb-3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <StatsGrid 
            ordersCount={ordersCount}
            productsCount={productsCount}
            usersCount={sellersCount}
            totalRevenue={totalRevenue}
            recentOrders={filteredOrders.slice(0, 5)}
            products={products}
            selectedYear={selectedYear}
          />
        )}
      </motion.div>

      

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-4 border-b border-slate-200/50 last:border-b-0">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-2 w-24" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <ProjectsTable 
            users={users}
            products={products}
            orders={orders}
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <ChartsShowcase 
            orders={{ ...orders, data: filteredOrders }}
            products={{ ...products, data: filteredProducts }}
            users={{ ...users, data: filteredUsers }}
            selectedYear={selectedYear}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
