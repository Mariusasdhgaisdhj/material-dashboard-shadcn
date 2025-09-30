import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
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

export default function Reports() {
  // Fetch data from multiple endpoints for reports
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({ 
    queryKey: ["/orders?page=1&limit=50"], 
    queryFn: () => getJson<any>("/orders?page=1&limit=50") 
  });
  
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({ 
    queryKey: ["/products?page=1&limit=50"], 
    queryFn: () => getJson<any>("/products?page=1&limit=50") 
  });
  
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({ 
    queryKey: ["/users?page=1&limit=50"], 
    queryFn: () => getJson<any>("/users?page=1&limit=50") 
  });
  
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({ 
    queryKey: ["/categories"], 
    queryFn: () => getJson<any>("/categories") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const orders: any[] = ordersData?.success && Array.isArray(ordersData.data) ? ordersData.data : [];
  const products: any[] = productsData?.success && Array.isArray(productsData.data) ? productsData.data : [];
  const users: any[] = usersData?.success && Array.isArray(usersData.data) ? usersData.data : [];
  const categories: any[] = categoriesData?.success && Array.isArray(categoriesData.data) ? categoriesData.data : [];
  
  const isLoading = ordersLoading || productsLoading || usersLoading || categoriesLoading;
  const hasError = ordersError || productsError || usersError || categoriesError;
  
  // Calculate statistics
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalCategories = categories.length;
  
  // Calculate revenue
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  
  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Get order status distribution
  const orderStatusCounts = orders.reduce((acc, order) => {
    const status = order.orderStatus || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get payment method distribution
  const paymentMethodCounts = orders.reduce((acc, order) => {
    const method = order.paymentMethod || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data
  const orderTrendData = orders.slice(0, 7).map((order, index) => ({
    day: `Day ${index + 1}`,
    orders: Math.floor(Math.random() * 10) + 1, // Simulate daily order count
    revenue: order.totalPrice || 0
  }));

  const paymentMethodChartData = Object.entries(paymentMethodCounts).map(([method, count]) => ({
    name: method,
    value: count,
    fill: method.toLowerCase().includes('gcash') ? '#22c55e' : 
          method.toLowerCase().includes('paypal') ? '#3b82f6' : 
          method.toLowerCase().includes('card') ? '#8b5cf6' : '#6b7280'
  }));

  const orderStatusChartData = Object.entries(orderStatusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    fill: status === 'completed' ? '#22c55e' :
          status === 'pending' ? '#f59e0b' :
          status === 'cancelled' ? '#ef4444' : '#6b7280'
  }));

  const categoryChartData = categories.slice(0, 5).map((category, index) => ({
    name: category.name || `Category ${index + 1}`,
    products: Math.floor(Math.random() * 20) + 1, // Simulate product count per category
    fill: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]
  }));

  // Mini chart data for summary cards
  const ordersMiniData = [2, 4, 1, 3, 5, 2, 4]; // Simulated daily order counts
  const revenueMiniData = [1200, 1800, 900, 1500, 2100, 1300, 1900]; // Simulated daily revenue
  const productsMiniData = [1, 2, 0, 3, 1, 2, 1]; // Simulated daily product additions
  const usersMiniData = [0, 1, 2, 1, 0, 1, 1]; // Simulated daily user registrations

  // Chart configurations
  const orderTrendConfig = {
    orders: {
      label: "Orders",
      color: "#22c55e",
    },
    revenue: {
      label: "Revenue",
      color: "#3b82f6",
    },
  };

  const paymentMethodConfig = {
    value: {
      label: "Count",
      color: "#22c55e",
    },
  };

  const orderStatusConfig = {
    value: {
      label: "Count", 
      color: "#22c55e",
    },
  };

  const categoryConfig = {
    products: {
      label: "Products",
      color: "#22c55e",
    },
  };
  
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-stone-200">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-stone-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-stone-500">Loading reports...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-red-500">Error loading reports data</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      {/* Summary Cards with Mini Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Orders</p>
                <p className="text-2xl font-bold text-stone-900">{totalOrders}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📦</span>
              </div>
            </div>
            <MiniChart 
              data={ordersMiniData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} 
              activeColor="#3b82f6" 
            />
          </CardContent>
        </Card>
        
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Revenue</p>
                <p className="text-2xl font-bold text-stone-900">₱{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">💰</span>
              </div>
            </div>
            <MiniChart 
              data={revenueMiniData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} 
              activeColor="#22c55e" 
            />
          </CardContent>
        </Card>
        
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Products</p>
                <p className="text-2xl font-bold text-stone-900">{totalProducts}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">🛍️</span>
              </div>
            </div>
            <MiniChart 
              data={productsMiniData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} 
              activeColor="#8b5cf6" 
            />
          </CardContent>
        </Card>
        
        <Card className="border-stone-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">Total Users</p>
                <p className="text-2xl font-bold text-stone-900">{totalUsers}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm">👥</span>
              </div>
            </div>
            <MiniChart 
              data={usersMiniData} 
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} 
              activeColor="#f59e0b" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Trends - Line Chart */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Order Trends</CardTitle>
            <p className="text-sm text-stone-500">Daily orders and revenue</p>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={orderTrendConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={orderTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Methods - Pie Chart */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Payment Methods</CardTitle>
            <p className="text-sm text-stone-500">Distribution by payment type</p>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={paymentMethodConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={paymentMethodChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status - Bar Chart */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Order Status Distribution</CardTitle>
            <p className="text-sm text-stone-500">Orders by status</p>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={orderStatusConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    name="Orders"
                  >
                    {orderStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Product Categories - Bar Chart */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Product Categories</CardTitle>
            <p className="text-sm text-stone-500">Products per category</p>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={categoryConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="products"
                    radius={[4, 4, 0, 0]}
                    name="Products"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Order Value */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-stone-900">₱{averageOrderValue.toLocaleString()}</p>
              <p className="text-sm text-stone-600 mt-2">Per order</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Categories */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Total Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-stone-900">{totalCategories}</p>
              <p className="text-sm text-stone-600 mt-2">Active categories</p>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-stone-900">
                {totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-stone-600 mt-2">Orders per user</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
