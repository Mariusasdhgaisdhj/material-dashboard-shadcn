import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Sample data for different chart types
const areaChartData = [
  { month: "Jan", sales: 24000, expenses: 12400 },
  { month: "Feb", sales: 18500, expenses: 8750 },
  { month: "Mar", sales: 32000, expenses: 15800 },
  { month: "Apr", sales: 27800, expenses: 13200 },
  { month: "May", sales: 21900, expenses: 9600 },
  { month: "Jun", sales: 29500, expenses: 16300 },
];

const lineChartData = [
  { day: "Mon", users: 24, sessions: 45 },
  { day: "Tue", users: 13, sessions: 32 },
  { day: "Wed", users: 98, sessions: 67 },
  { day: "Thu", users: 39, sessions: 54 },
  { day: "Fri", users: 48, sessions: 78 },
  { day: "Sat", users: 38, sessions: 56 },
  { day: "Sun", users: 43, sessions: 65 },
];

const pieChartData = [
  { name: "Desktop", value: 65, fill: "#22c55e" },
  { name: "Mobile", value: 28, fill: "#0c0a09" },
  { name: "Tablet", value: 7, fill: "#22c55e" },
];

const barChartData = [
  { category: "Q1", revenue: 120000, profit: 48000 },
  { category: "Q2", revenue: 190000, profit: 76000 },
  { category: "Q3", revenue: 155000, profit: 62000 },
  { category: "Q4", revenue: 225000, profit: 90000 },
];

const areaChartConfig = {
  sales: {
    label: "Sales",
    color: "#22c55e",
  },
  expenses: {
    label: "Expenses", 
    color: "#0c0a09",
  },
};

const lineChartConfig = {
  users: {
    label: "Users",
    color: "#22c55e",
  },
  sessions: {
    label: "Sessions",
    color: "#0c0a09",
  },
};

const barChartConfig = {
  revenue: {
    label: "Revenue",
    color: "#22c55e",
  },
  profit: {
    label: "Profit",
    color: "#0c0a09",
  },
};

const pieChartConfig = {
  desktop: {
    label: "Desktop",
    color: "#22c55e",
  },
  mobile: {
    label: "Mobile", 
    color: "#0c0a09",
  },
  tablet: {
    label: "Tablet",
    color: "#22c55e",
  },
};

interface ChartsShowcaseProps {
  orders?: any;
  products?: any;
  users?: any;
  selectedYear?: string;
}

export function ChartsShowcase({ orders, products, users, selectedYear }: ChartsShowcaseProps) {
  // Generate real data from backend
  const ordersData = orders?.success && Array.isArray(orders.data) ? orders.data : [];
  const productsData = products?.success && Array.isArray(products.data) ? products.data : [];
  const usersData = users?.success && Array.isArray(users.data) ? users.data : [];

  // Debug: Log the first product to see its structure
  if (productsData.length > 0) {
    console.log('First product structure:', productsData[0]);
    console.log('All products:', productsData);
  } else {
    console.log('No products found in productsData');
  }

  // Order trends data - real data grouped by day
  const orderTrendData = ordersData.reduce((acc: any, order: any) => {
    const orderDate = new Date(order.orderDate || order.createdAt);
    const dayKey = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!acc[dayKey]) {
      acc[dayKey] = { day: dayKey, orders: 0, revenue: 0 };
    }
    acc[dayKey].orders += 1;
    acc[dayKey].revenue += order.totalPrice || 0;
    return acc;
  }, {});

  // Convert to array and fill missing days
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const orderTrendArray = daysOfWeek.map(day => 
    orderTrendData[day] || { day, orders: 0, revenue: 0 }
  );

  // Payment method distribution
  const paymentMethodCounts = ordersData.reduce((acc: any, order: any) => {
    const method = order.paymentMethod || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const paymentMethodData = Object.entries(paymentMethodCounts).map(([method, count]) => ({
    name: method,
    value: count,
    fill: method.toLowerCase().includes('gcash') ? '#22c55e' : 
          method.toLowerCase().includes('paypal') ? '#3b82f6' : 
          method.toLowerCase().includes('card') ? '#8b5cf6' : '#6b7280'
  }));

  // Product categories data - real data from backend
  const categoryCounts = productsData.reduce((acc: any, product: any) => {
    // Handle different possible category structures based on actual API response
    let category = 'Uncategorized';
    
    // Try different ways to get the category name based on actual API structure
    if (product.proCategoryId?.name) {
      category = product.proCategoryId.name;
    } else if (product.categories?.name) {
      category = product.categories.name;
    } else if (product.category?.name) {
      category = product.category.name;
    } else if (product.category) {
      category = product.category;
    } else if (product.pro_category_id) {
      // If we have category ID but no name, we need to fetch it
      category = `Category ID: ${product.pro_category_id}`;
    }
    
    // Debug logging to see what we're getting
    if (productsData.length > 0) {
      console.log('Product category debug:', {
        productName: product.name,
        proCategoryId: product.proCategoryId,
        categories: product.categories,
        category: product.category,
        pro_category_id: product.pro_category_id,
        finalCategory: category
      });
    }
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
    category: category,
    products: count as number,
    revenue: productsData
      .filter((p: any) => {
        // Use the same logic to determine category for filtering
        let productCategory = 'Uncategorized';
        if (p.proCategoryId?.name) {
          productCategory = p.proCategoryId.name;
        } else if (p.categories?.name) {
          productCategory = p.categories.name;
        } else if (p.category?.name) {
          productCategory = p.category.name;
        } else if (p.category) {
          productCategory = p.category;
        } else if (p.pro_category_id) {
          productCategory = `Category ID: ${p.pro_category_id}`;
        }
        return productCategory === category;
      })
      .reduce((sum: number, p: any) => sum + (p.price || 0), 0)
  }));

  // Order status distribution (map online 'processing' to 'paid' for clarity)
  const orderStatusCounts = ordersData.reduce((acc: any, order: any) => {
    const raw = (order.orderStatus || order.status || 'pending') as string;
    const pm = String(order.paymentMethod || '').toLowerCase();
    const label = raw.toLowerCase(); // Status is now directly 'paid' for successful online payments
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const orderStatusData = Object.entries(orderStatusCounts).map(([status, count]) => ({
    status,
    count,
    fill: status === 'paid' ? '#22c55e' :
          status === 'delivered' ? '#16a34a' :
          status === 'shipped' ? '#3b82f6' :
          status === 'pending' ? '#f59e0b' :
          status === 'cancelled' ? '#ef4444' : '#6b7280'
  }));

  const orderTrendConfig = {
    orders: { label: "Orders", color: "#22c55e" },
    revenue: { label: "Revenue", color: "#3b82f6" },
  };

  const paymentMethodConfig = {
    value: { label: "Count", color: "#22c55e" },
  };

  const categoryConfig = {
    products: { label: "Products", color: "#22c55e" },
    revenue: { label: "Revenue", color: "#3b82f6" },
  };

  const orderStatusConfig = {
    count: { label: "Count", color: "#22c55e" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Order Trends - Line Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Order Trends</CardTitle>
          <p className="text-sm text-gray-500">
            Daily orders and revenue from real data
            {selectedYear && <span className="ml-1 text-blue-600">({selectedYear})</span>}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={orderTrendConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderTrendArray} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods</CardTitle>
          <p className="text-sm text-gray-500">Distribution by payment type</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={paymentMethodConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Product Categories - Bar Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Product Categories</CardTitle>
          <p className="text-sm text-gray-500">
            Products per category
            {selectedYear && <span className="ml-1 text-blue-600">({selectedYear})</span>}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="category" 
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
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Products"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Order Status - Bar Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Order Status Distribution</CardTitle>
          <p className="text-sm text-gray-500">Orders by status</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={orderStatusConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="status" 
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
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                >
                  {orderStatusData.map((entry, index) => (
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
  );
}