import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { ChartsShowcase } from "@/components/dashboard/charts-showcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      {/* Year Filter */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Dashboard</h1>
          <p className="text-stone-600 dark:text-stone-400">Analytics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-stone-500" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StatsGrid 
        ordersCount={ordersCount}
        productsCount={productsCount}
        usersCount={sellersCount}
        totalRevenue={totalRevenue}
        recentOrders={filteredOrders.slice(0, 5)}
        products={products}
        selectedYear={selectedYear}
      />
      <ProjectsTable 
        users={users}
        products={products}
        orders={orders}
      />
      <ChartsShowcase 
        orders={{ ...orders, data: filteredOrders }}
        products={{ ...products, data: filteredProducts }}
        users={{ ...users, data: filteredUsers }}
        selectedYear={selectedYear}
      />
    </div>
  );
}
