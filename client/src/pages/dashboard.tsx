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
import peopleBackground from "/images/material-persons.jpg";

export default function Dashboard() {
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

  const productsCount = productsArr.length;
  const ordersCount = ordersArr.length;
  // Count business owners (sellers)
  const sellersCount = usersArr.filter((u: any) => u.role === 'seller' || !!u.business_name).length;
  
  const isLoading = productsLoading || usersLoading || ordersLoading;
  
  // Calculate total revenue from real data
  const totalRevenue = orders?.success && Array.isArray(orders.data) ? 
    orders.data.reduce((sum: any, order: any) => sum + (order.totalPrice || 0), 0) : 0;

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <StatsGrid 
        ordersCount={ordersCount}
        productsCount={productsCount}
        usersCount={sellersCount}
        totalRevenue={totalRevenue}
        recentOrders={ordersArr.slice(0, 5)}
        products={products}
      />
      <ProjectsTable 
        users={users}
        products={products}
        orders={orders}
      />
      <ChartsShowcase 
        orders={orders}
        products={products}
        users={users}
      />
    </div>
  );
}
