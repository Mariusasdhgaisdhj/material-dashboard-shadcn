import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Package,
  Mail,
  Plus,
  Settings,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Trash2,
  X
} from "lucide-react";
// Enhanced Imports for Excel Export and Analytics
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Enhanced interfaces for better type safety
interface ReportTemplate {
  name: string;
  id: string;
  count: number;
  description: string;
  category: 'orders' | 'products' | 'users' | 'analytics' | 'financial' | 'custom';
  icon: string;
  lastGenerated?: Date;
}

interface CustomTemplate extends ReportTemplate {
  isCustom: boolean;
  filters?: any;
}

interface AuditLogEntry {
  id: string;
  action: string;
  template: string;
  timestamp: string;
  user: string;
  details?: string;
}

interface ReportData {
  orders: any[];
  products: any[];
  users: any[];
  categories: any[];
  analytics: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    averageOrderValue: number;
    conversionRate: number;
  };
}

interface AdminSalesMetrics {
  revenue: number;
  transactions: number;
  activeSellers: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  payoutsAmount: number; // total amount already paid out to sellers
  payoutsCount: number;  // number of paid-out orders
  payoutsBySeller: Array<{ sellerId: string; name: string; amount: number; count: number }>;
  byCategory: Array<{ name: string; revenue: number; orders: number }>;
  byProduct: Array<{ name: string; revenue: number; qty: number }>;
  byChannel: Array<{ name: string; orders: number; revenue: number }>;
  topSellers: Array<{ sellerId: string; name: string; revenue: number; orders: number }>;
  topRegions: Array<{ name: string; orders: number; revenue: number }>;
  topCustomers: Array<{ customerId: string; name: string; revenue: number; orders: number }>;
  refunds: number;
  discounts: number;
  commissions: number; // kept for compatibility (always 0 for free platform)
  netIncome: number;
  paymentMethods: Array<{ method: string; count: number; revenue: number }>;
}

export default function Reports() {
  // Enhanced state management
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState('name');
  const [emailFilter, setEmailFilter] = useState('');
  const [exportType, setExportType] = useState('excel');
  const [reportType, setReportType] = useState('orders');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ 
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)), 
    end: new Date() 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCharts, setShowCharts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  
  // Enhanced data structures
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [adminSales, setAdminSales] = useState<AdminSalesMetrics | null>(null);
  const [section, setSection] = useState<'overview'|'sales'|'customers'|'payouts'>('overview');

  // Enhanced data fetching with better error handling
  const { data: ordersData, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ["/orders?page=1&limit=100"],
    queryFn: () => getJson<any>("/orders?page=1&limit=100"),
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ["/products?page=1&limit=100"],
    queryFn: () => getJson<any>("/products?page=1&limit=100"),
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ["/users?page=1&limit=100"],
    queryFn: () => getJson<any>("/users?page=1&limit=100"),
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ["/categories"],
    queryFn: () => getJson<any>("/categories"),
    retry: 3,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Enhanced data processing with proper error handling
  const orders: any[] = ordersData?.success && Array.isArray(ordersData.data) ? ordersData.data : [];
  const products: any[] = productsData?.success && Array.isArray(productsData.data) ? productsData.data : [];
  const users: any[] = usersData?.success && Array.isArray(usersData.data) ? usersData.data : [];
  const categories: any[] = categoriesData?.success && Array.isArray(categoriesData.data) ? categoriesData.data : [];

  const isLoading = ordersLoading || productsLoading || usersLoading || categoriesLoading;
  const hasError = ordersError || productsError || usersError || categoriesError;

  // Process analytics data
  useEffect(() => {
    if (orders.length > 0 || products.length > 0 || users.length > 0) {
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalOrders = orders.length;
      const totalUsers = users.length;
      const totalProducts = products.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

      setReportData({
        orders,
        products,
        users,
        categories,
        analytics: {
          totalRevenue,
          totalOrders,
          totalUsers,
          totalProducts,
          averageOrderValue,
          conversionRate
        }
      });
    }
  }, [orders, products, users, categories]);

  // Compute Admin Sales metrics
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setAdminSales(null);
      return;
    }
    const tx = orders.length;
    const revenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    // Payouts (done) derived from server-provided flag on orders
    const paidOutOrders = orders.filter((o: any) => o.paidOut === true);
    const payoutsAmount = paidOutOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const payoutsCount = paidOutOrders.length;
    const activeCustomerIds = new Set<string>();
    const activeSellerIds = new Set<string>();
    const catMap = new Map<string, { name: string; revenue: number; orders: number }>();
    const prodMap = new Map<string, { name: string; revenue: number; qty: number }>();
    const channelMap = new Map<string, { name: string; orders: number; revenue: number }>();
    const regionMap = new Map<string, { name: string; orders: number; revenue: number }>();
    const sellerMap = new Map<string, { sellerId: string; name: string; revenue: number; orders: number }>();
    const customerMap = new Map<string, { customerId: string; name: string; revenue: number; orders: number }>();
    const pmMap = new Map<string, { method: string; count: number; revenue: number }>();

    let refunds = 0;
    let discounts = 0;
    let commissionsVar = 0; // Free platform: no commissions

    const productById: Record<string, any> = {};
    products.forEach(p => { productById[p._id] = p; });
    const categoryNameById: Record<string, string> = {};
    categories.forEach(c => { categoryNameById[c._id] = c.name; });
    const userNameById: Record<string, string> = {};
    users.forEach(u => { userNameById[u._id] = (u.business_name || u.businessName || u.name || u.email || 'Seller'); });

    for (const o of orders) {
      const orderTotal = o.totalPrice || 0;
      // customers
      const uid = o.userID?._id || o.userID || o.user?.id;
      if (uid) activeCustomerIds.add(String(uid));
      // payment methods
      const pm = (o.paymentMethod || 'Unknown').toString();
      const pmEntry = pmMap.get(pm) || { method: pm, count: 0, revenue: 0 };
      pmEntry.count += 1; pmEntry.revenue += orderTotal; pmMap.set(pm, pmEntry);
      // channel
      const channel = (o.channel || o.platform || o.source || 'website').toString();
      const ch = channelMap.get(channel) || { name: channel, orders: 0, revenue: 0 };
      ch.orders += 1; ch.revenue += orderTotal; channelMap.set(channel, ch);
      // region (city/state/country best-effort)
      const ship = o.shippingAddress || o.shipping_address || {};
      const region = (ship.city || ship.state || ship.country || 'Unknown').toString();
      const rg = regionMap.get(region) || { name: region, orders: 0, revenue: 0 };
      rg.orders += 1; rg.revenue += orderTotal; regionMap.set(region, rg);
      // refunds/discounts/commissions
      refunds += Number(o.refundAmount || 0);
      discounts += Number(o.orderTotal?.discount || o.discount || 0);
      commissionsVar += 0; // no commissions
      // top customers aggregation by order
      if (uid) {
        const custName = (o.userID?.name) || userNameById[String(uid)] || 'Customer';
        const cm = customerMap.get(String(uid)) || { customerId: String(uid), name: custName, revenue: 0, orders: 0 };
        cm.revenue += orderTotal; cm.orders += 1; customerMap.set(String(uid), cm);
      }
      // items
      const items = o.items || [];
      for (const it of items) {
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);
        const line = qty * price;
        const prodIdFromObj = (it.productID && typeof it.productID === 'object') ? (it.productID._id || it.productID.id) : undefined;
        const prodFromMap = prodIdFromObj && productById[prodIdFromObj] ? productById[prodIdFromObj] : (productById[it.productID] || undefined);
        const prodName = it.productName || (it.productID?.name) || prodFromMap?.name || 'Product';
        const prodEntry = prodMap.get(prodName) || { name: prodName, revenue: 0, qty: 0 };
        prodEntry.revenue += line; prodEntry.qty += qty; prodMap.set(prodName, prodEntry);

        let catId: string | undefined = undefined;
        if (it.productID && typeof it.productID === 'object') {
          catId = it.productID.proCategoryId?._id || it.productID.categoryId || it.productID.pro_category_id;
        }
        let catName = '';
        if (!catId && prodFromMap) {
          catId = prodFromMap.proCategoryId?._id || prodFromMap.pro_category_id;
          catName = prodFromMap.proCategoryId?.name || prodFromMap.category?.name || '';
        }
        catName = catName || categoryNameById[catId || ''] || it.productID?.proCategoryId?.name || it.productID?.category?.name || 'Uncategorized';
        const cEntry = catMap.get(catName) || { name: catName, revenue: 0, orders: 0 };
        cEntry.revenue += line; cEntry.orders += 1; catMap.set(catName, cEntry);

        // sellers
        let sellerId = it.productID?.seller_id || it.productID?.sellerId || it.seller_id || it.sellerId;
        if (!sellerId && prodFromMap) sellerId = prodFromMap.sellerId?._id || prodFromMap.seller_id;
        let sellerName = (it.productID?.seller?.name) || (prodFromMap?.sellerId?.name) || '';
        if (!sellerName && sellerId) sellerName = userNameById[String(sellerId)] || 'Seller';
        if (sellerId) {
          activeSellerIds.add(String(sellerId));
          const sEntry = sellerMap.get(String(sellerId)) || { sellerId: String(sellerId), name: sellerName, revenue: 0, orders: 0 };
          sEntry.revenue += line; sEntry.orders += 1; sellerMap.set(String(sellerId), sEntry);
        }
      }
    }

    // No commissions in free platform
    const netIncome = revenue - refunds - discounts;

    const toSortedArray = <T extends { [k: string]: any }>(m: Map<string, T>, sortKey: keyof T, desc = true, limit?: number): T[] => {
      const arr = Array.from(m.values()).sort((a, b) => (desc ? (Number(b[sortKey]) - Number(a[sortKey])) : (Number(a[sortKey]) - Number(b[sortKey]))));
      return typeof limit === 'number' ? arr.slice(0, limit) : arr;
    };

    // Demographics: new vs returning in the selected range
    let newCustomersCount = 0;
    let returningCustomersCount = 0;
    Array.from(customerMap.values()).forEach((c) => {
      if (c.orders > 1) returningCustomersCount += 1; else newCustomersCount += 1;
    });

    // Aggregate payouts by seller (for displaying seller names)
    const payoutsBySellerMap = new Map<string, { sellerId: string; name: string; amount: number; count: number }>();
    for (const o of paidOutOrders) {
      // Use first item's seller as owner of the payout
      const items = o.items || [];
      let sid: string | undefined;
      let sname = '';
      for (const it of items) {
        sid = it.productID?.seller_id || it.productID?.sellerId || it.seller_id || it.sellerId;
        // If still missing, try resolving via products list using productID
        if (!sid) {
          const prodIdFromObj = (it.productID && typeof it.productID === 'object') ? (it.productID._id || it.productID.id) : undefined;
          const prodFromMap = prodIdFromObj && productById[prodIdFromObj] ? productById[prodIdFromObj] : (productById[it.productID] || undefined);
          if (prodFromMap) {
            sid = prodFromMap.sellerId?._id || prodFromMap.seller_id;
            if (!sname) sname = prodFromMap.sellerId?.name || '';
          }
        }
        if (sid) {
          sname = sname || userNameById[String(sid)] || it.productID?.seller?.name || 'Seller';
          break;
        }
      }
      if (sid) {
        // Prefer the already-resolved seller name from sellerMap when available
        const resolvedFromSellerMap = sellerMap.get(String(sid))?.name || '';
        const finalName = resolvedFromSellerMap || sname || userNameById[String(sid)] || 'Seller';
        const entry = payoutsBySellerMap.get(String(sid)) || { sellerId: String(sid), name: finalName, amount: 0, count: 0 };
        // Keep the better name if it becomes available later
        if (!entry.name || entry.name === 'Seller') {
          entry.name = finalName;
        }
        entry.amount += (o.totalPrice || 0); entry.count += 1; payoutsBySellerMap.set(String(sid), entry);
      }
    }

    setAdminSales({
      revenue,
      transactions: tx,
      activeSellers: activeSellerIds.size,
      activeCustomers: activeCustomerIds.size,
      newCustomers: newCustomersCount,
      returningCustomers: returningCustomersCount,
      payoutsAmount,
      payoutsCount,
      payoutsBySeller: Array.from(payoutsBySellerMap.values()).sort((a, b) => b.amount - a.amount),
      byCategory: toSortedArray(catMap, 'revenue', true, 10),
      byProduct: toSortedArray(prodMap, 'revenue', true, 10),
      byChannel: toSortedArray(channelMap, 'revenue', true),
      topSellers: toSortedArray(sellerMap, 'revenue', true, 10),
      topRegions: toSortedArray(regionMap, 'revenue', true, 10),
      topCustomers: toSortedArray(customerMap, 'revenue', true, 10),
      refunds,
      discounts,
      commissions: commissionsVar,
      netIncome,
      paymentMethods: toSortedArray(pmMap, 'count', true),
    });
  }, [orders, products, users, categories]);

  // Enhanced date filtering with multiple date fields
  const filterByDate = (items: any[], dateFields: string[]) => {
    if (!dateRange.start || !dateRange.end) return items;
    return items.filter(item => {
      const itemDate = new Date();
      for (const field of dateFields) {
        if (item[field]) {
          itemDate.setTime(new Date(item[field]).getTime());
          break;
        }
      }
      return itemDate >= dateRange.start! && itemDate <= dateRange.end!;
    });
  };

  const filteredOrders = filterByDate(orders, ['orderDate', 'createdAt', 'updatedAt']);
  const filteredProducts = filterByDate(products, ['createdAt', 'updatedAt']);
  const filteredUsers = filterByDate(users, ['createdAt', 'lastLogin', 'registeredAt']);

  // Comprehensive report templates with enhanced metadata
  const baseTemplates: ReportTemplate[] = [
    { 
      name: 'Sales Orders Report', 
      id: 'orders', 
      count: filteredOrders.length,
      description: 'Complete sales orders with customer details, payment status, and order items',
      category: 'orders',
      icon: 'Package',
      lastGenerated: new Date()
    },
    { 
      name: 'Product Inventory Report', 
      id: 'products', 
      count: filteredProducts.length,
      description: 'Product catalog with pricing, stock levels, and category information',
      category: 'products',
      icon: 'Package',
      lastGenerated: new Date()
    },
    { 
      name: 'Customer Database Report', 
      id: 'users', 
      count: filteredUsers.length,
      description: 'Customer information including contact details and purchase history',
      category: 'users',
      icon: 'Users',
      lastGenerated: new Date()
    },
    { 
      name: 'Category Analysis Report', 
      id: 'categories', 
      count: categories.length,
      description: 'Product categories with performance metrics and trends',
      category: 'analytics',
      icon: 'BarChart3',
      lastGenerated: new Date()
    },
    { 
      name: 'Financial Summary Report', 
      id: 'financial', 
      count: reportData?.analytics.totalRevenue || 0,
      description: 'Revenue analysis, payment methods, and financial performance metrics',
      category: 'financial',
      icon: 'DollarSign',
      lastGenerated: new Date()
    },
    { 
      name: 'Business Analytics Dashboard', 
      id: 'analytics', 
      count: reportData?.analytics.totalOrders || 0,
      description: 'Comprehensive business metrics, KPIs, and performance indicators',
      category: 'analytics',
      icon: 'TrendingUp',
      lastGenerated: new Date()
    },
    { 
      name: 'Executive Summary Report', 
      id: 'summary', 
      count: (filteredOrders.length + filteredProducts.length + filteredUsers.length),
      description: 'High-level overview of business performance and key metrics',
      category: 'analytics',
      icon: 'FileText',
      lastGenerated: new Date()
    },
    { 
      name: 'Admin Sales Report', 
      id: 'admin_sales', 
      count: filteredOrders.length,
      description: 'Platform-wide sales performance: revenue, breakdowns, top sellers/products, net income',
      category: 'analytics',
      icon: 'BarChart3',
      lastGenerated: new Date()
    },
  ];

  const allTemplates = [...baseTemplates, ...customTemplates];

  // Sort templates (Enhanced)
  const sortedTemplates = [...allTemplates].sort((a, b) => {
    const aVal = a[sortBy as keyof typeof a];
    const bVal = b[sortBy as keyof typeof b];
    
    // Handle undefined values
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
    if (bVal === undefined) return sortOrder === 'asc' ? -1 : 1;
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination (New)
  const paginatedTemplates = sortedTemplates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Chart Data (New: Sample data for revenue and top products)
  const revenueChartData = filteredOrders.slice(0, 12).map((order, idx) => ({
    month: `Month ${idx + 1}`,
    revenue: order.totalPrice || 0,
  }));

  const topProductsData = filteredProducts.slice(0, 5).map(product => ({
    name: product.name,
    sales: Math.floor(Math.random() * 100), // Mock; replace with real sales count
  }));

  const handleSearch = () => {
    console.log('Searching with:', { sortOrder, emailFilter, reportType, dateRange });
    toast({
      title: "Search Applied",
      description: `Filtered by ${emailFilter ? `email: ${emailFilter}` : 'all'} | Date: ${dateRange.start?.toLocaleDateString() || 'All'}`,
    });
  };

  // Comprehensive Excel Export Function
  const generateExcelReport = (template: ReportTemplate) => {
    setIsGenerating(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      const dateStr = dateRange.start ? `_${dateRange.start.toISOString().split('T')[0]}_to_${dateRange.end?.toISOString().split('T')[0]}` : '';
      
      // Create summary sheet
      const summaryData = [
        ['AgriGrow Business Report', ''],
        ['Generated On', new Date().toLocaleString()],
        ['Report Period', `${dateRange.start?.toLocaleDateString() || 'All Time'} - ${dateRange.end?.toLocaleDateString() || 'Present'}`],
        ['Report Type', template.name],
        ['', ''],
        ['Business Metrics', ''],
        ['Total Revenue', `₱${reportData?.analytics.totalRevenue.toFixed(2) || '0.00'}`],
        ['Total Orders', reportData?.analytics.totalOrders || 0],
        ['Total Customers', reportData?.analytics.totalUsers || 0],
        ['Total Products', reportData?.analytics.totalProducts || 0],
        ['Average Order Value', `₱${reportData?.analytics.averageOrderValue.toFixed(2) || '0.00'}`],
        ['Conversion Rate', `${reportData?.analytics.conversionRate.toFixed(2) || '0.00'}%`],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Generate specific report sheets based on template
      switch (template.id) {
        case 'orders':
          generateOrdersSheet(workbook);
          break;
        case 'products':
          generateProductsSheet(workbook);
          break;
        case 'users':
          generateUsersSheet(workbook);
          break;
        case 'categories':
          generateCategoriesSheet(workbook);
          break;
        case 'financial':
          generateFinancialSheet(workbook);
          break;
        case 'analytics':
          generateAnalyticsSheet(workbook);
          break;
        case 'admin_sales':
          generateAdminSalesSheet(workbook);
          break;
        case 'summary':
          generateSummarySheet(workbook);
          break;
        default:
          generateDefaultSheet(workbook, template);
      }

      // Save the file
      const fileName = `${template.name.replace(/\s+/g, '_')}${dateStr}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({ 
        title: "Excel Report Generated", 
        description: `${template.name} exported successfully as ${fileName}`,
        variant: "default"
      });

      // Add to audit log
      addAuditLog('Excel Generated', template.name, `Exported ${fileName}`);
      
    } catch (error) {
      console.error('Error generating Excel report:', error);
      toast({ 
        title: "Export Failed", 
        description: "Failed to generate Excel report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Individual sheet generators
  const generateOrdersSheet = (workbook: XLSX.WorkBook) => {
    const ordersData = [
      ['Order ID', 'Customer Name', 'Customer Email', 'Order Status', 'Payment Method', 'Total Amount', 'Order Date', 'Items Count', 'Shipping Address']
    ];

    filteredOrders.forEach(order => {
      ordersData.push([
        order._id || 'N/A',
        order.userID?.name || order.customerName || 'Unknown',
        order.userID?.email || order.customerEmail || 'N/A',
        order.orderStatus || 'Pending',
        order.paymentMethod || 'N/A',
        order.totalPrice || 0,
        order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A',
        order.items?.length || 0,
        order.shippingAddress || 'N/A'
      ]);
    });

    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
  };

  const generateProductsSheet = (workbook: XLSX.WorkBook) => {
    const productsData = [
      ['Product ID', 'Product Name', 'Category', 'Price', 'Stock Quantity', 'Description', 'Created Date', 'Status', 'SKU']
    ];

    filteredProducts.forEach(product => {
      productsData.push([
        product._id || 'N/A',
        product.name || 'Unknown',
        product.proCategoryId?.name || product.category?.name || product.categoryName || 'Uncategorized',
        product.price || 0,
        product.stockQuantity || product.quantity || 0,
        product.description || 'N/A',
        product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A',
        product.status || 'Active',
        product.sku || 'N/A'
      ]);
    });

    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
  };

  const generateUsersSheet = (workbook: XLSX.WorkBook) => {
    const usersData = [
      ['User ID', 'Name', 'Email', 'Phone', 'Registration Date', 'Last Login', 'Total Orders', 'Total Spent', 'Status']
    ];

    filteredUsers.forEach(user => {
      const userOrders = orders.filter(order => order.userID?._id === user._id);
      const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      
      usersData.push([
        user._id || 'N/A',
        user.name || 'Unknown',
        user.email || 'N/A',
        user.phone || 'N/A',
        user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A',
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
        userOrders.length,
        totalSpent,
        user.status || 'Active'
      ]);
    });

    const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Customers');
  };

  const generateCategoriesSheet = (workbook: XLSX.WorkBook) => {
    const categoriesData = [
      ['Category ID', 'Category Name', 'Description', 'Product Count', 'Total Revenue', 'Created Date', 'Status']
    ];

    categories.forEach(category => {
      const categoryProducts = products.filter(product => 
        product.proCategoryId?._id === category._id || product.category?._id === category._id
      );
      const categoryRevenue = orders.reduce((sum, order) => {
        const categoryItems = order.items?.filter((item: any) => 
          categoryProducts.some(p => p._id === item.product?._id)
        ) || [];
        return sum + categoryItems.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0);
      }, 0);

      categoriesData.push([
        category._id || 'N/A',
        category.name || 'Unknown',
        category.description || 'N/A',
        categoryProducts.length,
        categoryRevenue,
        category.createdAt ? new Date(category.createdAt).toLocaleString() : 'N/A',
        category.status || 'Active'
      ]);
    });

    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');
  };

  const generateFinancialSheet = (workbook: XLSX.WorkBook) => {
    const financialData = [
      ['Metric', 'Value', 'Percentage', 'Description'],
      ['Total Revenue', reportData?.analytics.totalRevenue || 0, '100%', 'Total sales revenue'],
      ['Average Order Value', reportData?.analytics.averageOrderValue || 0, `${((reportData?.analytics.averageOrderValue || 0) / (reportData?.analytics.totalRevenue || 1) * 100).toFixed(2)}%`, 'Average amount per order'],
      ['Total Orders', reportData?.analytics.totalOrders || 0, '100%', 'Total number of orders'],
      ['Conversion Rate', `${reportData?.analytics.conversionRate || 0}%`, '100%', 'Customer conversion rate'],
      ['', '', '', ''],
      ['Payment Methods', '', '', ''],
      ['Cash on Delivery', orders.filter(o => o.paymentMethod === 'COD').length, `${(orders.filter(o => o.paymentMethod === 'COD').length / orders.length * 100).toFixed(2)}%`, 'Cash on delivery orders'],
      ['Credit Card', orders.filter(o => o.paymentMethod === 'Credit Card').length, `${(orders.filter(o => o.paymentMethod === 'Credit Card').length / orders.length * 100).toFixed(2)}%`, 'Credit card payments'],
      ['Bank Transfer', orders.filter(o => o.paymentMethod === 'Bank Transfer').length, `${(orders.filter(o => o.paymentMethod === 'Bank Transfer').length / orders.length * 100).toFixed(2)}%`, 'Bank transfer payments'],
    ];

    const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial');
  };

  const generateAnalyticsSheet = (workbook: XLSX.WorkBook) => {
    const analyticsData = [
      ['Business Analytics Dashboard', ''],
      ['Generated On', new Date().toLocaleString()],
      ['', ''],
      ['Key Performance Indicators', ''],
      ['Total Revenue', reportData?.analytics.totalRevenue || 0],
      ['Total Orders', reportData?.analytics.totalOrders || 0],
      ['Total Customers', reportData?.analytics.totalUsers || 0],
      ['Total Products', reportData?.analytics.totalProducts || 0],
      ['Average Order Value', reportData?.analytics.averageOrderValue || 0],
      ['Conversion Rate', `${reportData?.analytics.conversionRate || 0}%`],
      ['', ''],
      ['Monthly Revenue Trend', ''],
      ['Month', 'Revenue', 'Orders', 'New Customers'],
    ];

    // Add monthly data (last 12 months)
    const monthlyData = getMonthlyAnalytics();
    monthlyData.forEach(month => {
      analyticsData.push([month.month, month.revenue, month.orders, month.newCustomers]);
    });

    const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
    XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
  };

  const generateSummarySheet = (workbook: XLSX.WorkBook) => {
    const summaryData = [
      ['Executive Summary Report', ''],
      ['Generated On', new Date().toLocaleString()],
      ['Report Period', `${dateRange.start?.toLocaleDateString() || 'All Time'} - ${dateRange.end?.toLocaleDateString() || 'Present'}`],
      ['', ''],
      ['Business Overview', ''],
      ['Total Revenue', `₱${reportData?.analytics.totalRevenue.toFixed(2) || '0.00'}`],
      ['Total Orders', reportData?.analytics.totalOrders || 0],
      ['Total Customers', reportData?.analytics.totalUsers || 0],
      ['Total Products', reportData?.analytics.totalProducts || 0],
      ['Average Order Value', `₱${reportData?.analytics.averageOrderValue.toFixed(2) || '0.00'}`],
      ['Conversion Rate', `${reportData?.analytics.conversionRate.toFixed(2) || '0.00'}%`],
      ['', ''],
      ['Top Performing Categories', ''],
      ['Category', 'Revenue', 'Orders', 'Products'],
    ];

    // Add top categories
    const topCategories = getTopCategories();
    topCategories.forEach(category => {
      summaryData.push([category.name, category.revenue, category.orders, category.products]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
  };

  const generateAdminSalesSheet = (workbook: XLSX.WorkBook) => {
    const m = adminSales;
    const sheetData: any[] = [
      ['Admin Sales Report', ''],
      ['Generated On', new Date().toLocaleString()],
      ['', ''],
      ['Totals', ''],
      ['Total Revenue', m?.revenue || 0],
      ['Transactions', m?.transactions || 0],
      ['Active Sellers', m?.activeSellers || 0],
      ['Active Customers', m?.activeCustomers || 0],
      ['Done Payouts (Amount)', m?.payoutsAmount || 0],
      ['Done Payouts (Count)', m?.payoutsCount || 0],
      ['', ''],
      ['Financials', ''],
      ['Refunds', m?.refunds || 0],
      ['Discounts', m?.discounts || 0],
      ['Commissions (est.)', m?.commissions || 0],
      ['Net Income', m?.netIncome || 0],
    ];

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Admin Sales');

    // Append breakdowns
    const appendTable = (title: string, headers: string[], rows: any[][], tabName: string) => {
      const data = [[title, ''], headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, ws, tabName);
    };

    appendTable('By Category', ['Category', 'Revenue', 'Orders'], (m?.byCategory || []).map(r => [r.name, r.revenue, r.orders]), 'AS By Category');
    appendTable('By Product', ['Product', 'Revenue', 'Qty'], (m?.byProduct || []).map(r => [r.name, r.revenue, r.qty]), 'AS By Product');
    appendTable('By Channel', ['Channel', 'Orders', 'Revenue'], (m?.byChannel || []).map(r => [r.name, r.orders, r.revenue]), 'AS By Channel');
    appendTable('Top Sellers', ['Seller', 'Revenue', 'Orders'], (m?.topSellers || []).map(r => [r.name, r.revenue, r.orders]), 'AS Top Sellers');
    appendTable('Top Regions', ['Region', 'Orders', 'Revenue'], (m?.topRegions || []).map(r => [r.name, r.orders, r.revenue]), 'AS Regions');
    appendTable('Payment Methods', ['Method', 'Count', 'Revenue'], (m?.paymentMethods || []).map(r => [r.method, r.count, r.revenue]), 'AS Payments');
    appendTable('Payouts By Seller', ['Seller', 'Amount', 'Orders'], (m?.payoutsBySeller || []).map(r => [r.name, r.amount, r.count]), 'AS Payouts');
  };

  const exportAdminSalesCSV = () => {
    if (!adminSales) return;
    const lines: string[] = [];
    const push = (arr: any[]) => lines.push(arr.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(','));
    push(['Metric','Value']);
    push(['Total Revenue', adminSales.revenue]);
    push(['Transactions', adminSales.transactions]);
    push(['Active Sellers', adminSales.activeSellers]);
    push(['Active Customers', adminSales.activeCustomers]);
    push(['New Customers', adminSales.newCustomers]);
    push(['Returning Customers', adminSales.returningCustomers]);
    push(['Done Payouts (Amount)', adminSales.payoutsAmount]);
    push(['Done Payouts (Count)', adminSales.payoutsCount]);
    push(['Refunds', adminSales.refunds]);
    push(['Discounts', adminSales.discounts]);
    push(['Net Income', adminSales.netIncome]);
    push(['']);
    push(['By Category']);
    push(['Category','Revenue','Orders']);
    adminSales.byCategory.forEach(r => push([r.name, r.revenue, r.orders]));
    push(['']);
    push(['Top Sellers']);
    push(['Seller','Revenue','Orders']);
    adminSales.topSellers.forEach(s => push([s.name, s.revenue, s.orders]));
    push(['']);
    push(['Payouts Completed']);
    push(['Seller','Amount','Orders']);
    adminSales.payoutsBySeller.forEach(p => push([p.name, p.amount, p.count]));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `admin_sales_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const generateAdminSalesPDF = () => {
    if (!adminSales) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Admin Sales Report', 20, 20);
    doc.setFontSize(12);
    const fmt = (n: number) => `PHP ${Number(n || 0).toLocaleString()}`; // Avoid ₱ which isn't supported by default font
    const table: any[] = [
      ['Total Revenue', fmt(adminSales.revenue)],
      ['Transactions', adminSales.transactions],
      ['Active Sellers', adminSales.activeSellers],
      ['Active Customers', adminSales.activeCustomers],
      ['New Customers', adminSales.newCustomers],
      ['Returning Customers', adminSales.returningCustomers],
      ['Done Payouts (Amount)', fmt(adminSales.payoutsAmount)],
      ['Done Payouts (Count)', adminSales.payoutsCount],
      ['Refunds', fmt(adminSales.refunds)],
      ['Discounts', fmt(adminSales.discounts)],
    
      ['Net Income', fmt(adminSales.netIncome)],
    ];
    autoTable(doc, { head: [['Metric','Value']], body: table, startY: 30 });
    doc.save(`admin_sales_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateDefaultSheet = (workbook: XLSX.WorkBook, template: ReportTemplate) => {
    const defaultData = [
      [template.name, ''],
      ['Generated On', new Date().toLocaleString()],
      ['Description', template.description],
      ['', ''],
      ['Data Count', template.count],
      ['Category', template.category],
    ];

    const defaultSheet = XLSX.utils.aoa_to_sheet(defaultData);
    XLSX.utils.book_append_sheet(workbook, defaultSheet, template.name.replace(/\s+/g, '_'));
  };

  // Helper functions for analytics
  const getMonthlyAnalytics = () => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
        orders: monthOrders.length,
        newCustomers: 0 // This would need to be calculated based on user registration dates
      });
    }
    return months;
  };

  const getTopCategories = () => {
    return categories.map(category => {
      const categoryProducts = products.filter(product => 
        product.proCategoryId?._id === category._id || product.category?._id === category._id
      );
      const categoryOrders = orders.filter(order => 
        order.items?.some((item: any) => 
          categoryProducts.some(p => p._id === item.product?._id)
        )
      );
      const categoryRevenue = categoryOrders.reduce((sum, order) => {
        const categoryItems = order.items?.filter((item: any) => 
          categoryProducts.some(p => p._id === item.product?._id)
        ) || [];
        return sum + categoryItems.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0);
      }, 0);

      return {
        name: category.name,
        revenue: categoryRevenue,
        orders: categoryOrders.length,
        products: categoryProducts.length
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  const addAuditLog = (action: string, template: string, details?: string) => {
    const newLog: AuditLogEntry = {
      id: Date.now().toString(),
      action,
      template,
      timestamp: new Date().toISOString(),
      user: 'Admin', // Replace with actual user from auth context
      details
    };
    setAuditLog(prev => [...prev, newLog]);
  };

  // Enhanced Custom Report Builder
  const addCustomTemplate = (name: string) => {
    const newTemplate: CustomTemplate = { 
      name: `Custom - ${name}`, 
      id: `custom-${Date.now()}`, 
      count: 0,
      description: `Custom report: ${name}`,
      category: 'custom',
      icon: 'FileText',
      isCustom: true,
      lastGenerated: new Date()
    };
    setCustomTemplates(prev => [...prev, newTemplate]);
    localStorage.setItem('customReports', JSON.stringify([...customTemplates, newTemplate]));
    toast({ title: "Custom Template Added", description: `${name} saved successfully!` });
    addAuditLog('Custom Template Created', newTemplate.name);
  };

  // Delete Custom Template
  const deleteCustomTemplate = (templateId: string) => {
    const template = customTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Remove from selected templates if it was selected
    setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    
    // Remove from custom templates
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    
    // Update localStorage
    localStorage.setItem('customReports', JSON.stringify(updatedTemplates));
    
    toast({ 
      title: "Template Deleted", 
      description: `${template.name} has been removed successfully!`,
      variant: "default"
    });
    addAuditLog('Custom Template Deleted', template.name);
  };

  // Delete Multiple Templates
  const deleteSelectedTemplates = () => {
    if (selectedTemplates.length === 0) {
      toast({ 
        title: "No Templates Selected", 
        description: "Please select templates to delete.",
        variant: "destructive"
      });
      return;
    }

    const customSelectedTemplates = selectedTemplates.filter(id => 
      customTemplates.some(t => t.id === id)
    );

    if (customSelectedTemplates.length === 0) {
      toast({ 
        title: "Cannot Delete System Templates", 
        description: "Only custom templates can be deleted.",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog
    const templateNames = customSelectedTemplates.map(id => {
      const template = customTemplates.find(t => t.id === id);
      return template?.name || 'Unknown';
    }).join(', ');

    if (!confirm(`Are you sure you want to delete the following custom templates?\n\n${templateNames}\n\nThis action cannot be undone.`)) {
      return;
    }

    // Remove selected custom templates
    const updatedTemplates = customTemplates.filter(t => !customSelectedTemplates.includes(t.id));
    setCustomTemplates(updatedTemplates);
    setSelectedTemplates([]);
    
    // Update localStorage
    localStorage.setItem('customReports', JSON.stringify(updatedTemplates));
    
    toast({ 
      title: "Templates Deleted", 
      description: `${customSelectedTemplates.length} custom template(s) deleted successfully!`,
      variant: "default"
    });
    
    customSelectedTemplates.forEach(templateId => {
      const template = customTemplates.find(t => t.id === templateId);
      if (template) {
        addAuditLog('Custom Template Deleted', template.name);
      }
    });
  };

  // Enhanced Email Report with proper integration
  const emailReport = (template: ReportTemplate) => {
    const subject = encodeURIComponent(`${template.name} - AgriGrow Report`);
    const body = encodeURIComponent(`Please find attached the ${template.name} report generated on ${new Date().toLocaleDateString()}.`);
    window.open(`mailto:admin@agrigrow.com?subject=${subject}&body=${body}`);
    toast({ title: "Email Opened", description: `${template.name} report ready to email` });
    addAuditLog('Report Emailed', template.name, 'Email client opened');
  };

  // Enhanced Export with multiple formats
  const handleBulkExport = () => {
    if (selectedTemplates.length === 0) {
      toast({ 
        title: "No Templates Selected", 
        description: "Please select at least one report template to export.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      if (exportType === 'excel') {
        // Export all selected templates as separate Excel files
        selectedTemplates.forEach(templateId => {
          const template = allTemplates.find(t => t.id === templateId);
          if (template) {
            generateExcelReport(template);
          }
        });
      } else if (exportType === 'pdf') {
        // Generate comprehensive PDF
        generateComprehensivePDF();
      }
    } catch (error) {
      console.error('Bulk export error:', error);
      toast({ 
        title: "Export Failed", 
        description: "Failed to export reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate comprehensive PDF
  const generateComprehensivePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('AgriGrow Comprehensive Business Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Report Period: ${dateRange.start?.toLocaleDateString() || 'All Time'} - ${dateRange.end?.toLocaleDateString() || 'Present'}`, 20, 45);

    // Add summary data
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', `₱${reportData?.analytics.totalRevenue.toFixed(2) || '0.00'}`],
      ['Total Orders', reportData?.analytics.totalOrders || 0],
      ['Total Customers', reportData?.analytics.totalUsers || 0],
      ['Total Products', reportData?.analytics.totalProducts || 0],
      ['Average Order Value', `₱${reportData?.analytics.averageOrderValue.toFixed(2) || '0.00'}`],
      ['Conversion Rate', `${reportData?.analytics.conversionRate.toFixed(2) || '0.00'}%`]
    ];

    autoTable(doc, {
      head: [['Business Summary', '']],
      body: summaryData,
      startY: 60,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] }
    });

    const fileName = `AgriGrow_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast({ title: "PDF Generated", description: "Comprehensive PDF report exported" });
    addAuditLog('PDF Generated', 'Comprehensive Report', `Exported ${fileName}`);
  };

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customReports');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    }
  }, []);

  // Save custom templates to localStorage
  useEffect(() => {
    if (customTemplates.length > 0) {
      localStorage.setItem('customReports', JSON.stringify(customTemplates));
    }
  }, [customTemplates]);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-slate-200 bg-white shadow-lg">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading Reports Data...</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-slate-500 flex flex-col items-center justify-center space-y-4">
              <div className="animate-pulse">
                <BarChart3 className="w-12 h-12 text-slate-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Preparing your business analytics...</p>
                <p className="text-sm">This may take a few moments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-red-200 bg-red-50 shadow-lg">
          <CardHeader className="border-b border-red-200">
            <CardTitle className="text-lg font-semibold text-red-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Error Loading Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-red-600 space-y-4">
              <p className="text-lg font-medium">Failed to load reports data</p>
              <p className="text-sm">Please check your connection and try again</p>
              <Button 
                onClick={() => {
                  refetchOrders();
                  refetchProducts();
                  refetchUsers();
                  refetchCategories();
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New: Role Check (Mock; integrate with auth context)
  const isAdmin = true; // Replace with real check, e.g., from user role

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6 custom-scrollbar"
    >
      {/* Enhanced Header with Analytics Overview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10"></div>
        <div className="relative p-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-3 mb-4"
              >
                <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 bg-clip-text text-transparent">
                    Reports
                  </h1>
                  
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-slate-600 dark:text-slate-300 text-lg mb-4"
              >
                Generate comprehensive business analytics and insights for data-driven decisions
              </motion.p>
              
              
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center space-x-3"
            >
          
             
            </motion.div>
          </div>
        </div>
      </motion.div>

         
      

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="space-y-6"
      >
        {/* Admin Sales Report Summary */}
        {adminSales && (
          <Card className="border-emerald-200 bg-white shadow-lg">
           
          <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                <Button variant={section === 'overview' ? 'default' : 'outline'} onClick={() => setSection('overview')}>Overview</Button>
                <Button variant={section === 'sales' ? 'default' : 'outline'} onClick={() => setSection('sales')}>Sales</Button>
                <Button variant={section === 'customers' ? 'default' : 'outline'} onClick={() => setSection('customers')}>Customers</Button>
                <Button variant={section === 'payouts' ? 'default' : 'outline'} onClick={() => setSection('payouts')}>Payouts</Button>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-slate-500">Total Revenue</div>
                  <div className="text-2xl font-bold text-emerald-600">₱{adminSales.revenue.toLocaleString()}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-slate-500">Transactions</div>
                  <div className="text-2xl font-bold">{adminSales.transactions}</div>
              </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-slate-500">Active Sellers</div>
                  <div className="text-2xl font-bold">{adminSales.activeSellers}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-slate-500">Active Customers</div>
                  <div className="text-2xl font-bold">{adminSales.activeCustomers}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-slate-500">Done Payouts (Amount)</div>
                  <div className="text-2xl font-bold text-emerald-600">₱{adminSales.payoutsAmount.toLocaleString()}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-xs text-slate-500">Done Payouts (Count)</div>
                  <div className="text-2xl font-bold">{adminSales.payoutsCount}</div>
                </div>
              </div>

              {section === 'sales' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Top Categories</div>
                  <div className="space-y-2 text-sm">
                    {adminSales.byCategory.slice(0,5).map(c => (
                      <div key={c.name} className="flex justify-between">
                        <span>{c.name}</span>
                        <span className="font-medium">₱{c.revenue.toLocaleString()}</span>
                </div>
                    ))}
              </div>
            </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Best-selling Products</div>
                  <div className="space-y-2 text-sm">
                    {adminSales.byProduct.slice(0,5).map(p => (
                      <div key={p.name} className="flex justify-between">
                        <span>{p.name}</span>
                        <span className="font-medium">₱{p.revenue.toLocaleString()}</span>
                  </div>
                    ))}
              </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Top Sellers</div>
                  <div className="space-y-2 text-sm">
                    {adminSales.topSellers.slice(0,5).map(s => (
                      <div key={s.sellerId} className="flex justify-between">
                        <span>{s.name}</span>
                        <span className="font-medium">₱{s.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Top Customers</div>
                  <div className="space-y-2 text-sm">
                    {adminSales.topCustomers.slice(0,5).map(c => (
                      <div key={c.customerId} className="flex justify-between">
                        <span>{c.name}</span>
                        <span className="font-medium">₱{c.revenue.toLocaleString()}</span>
              </div>
                    ))}
                  </div>
                </div>
              </div>
              )}

              {section === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Payment Methods</div>
                  <div className="space-y-1 text-sm">
                    {adminSales.paymentMethods.map(m => (
                      <div key={m.method} className="flex justify-between">
                        <span>{m.method}</span>
                        <span className="font-medium">{m.count} ({`₱${m.revenue.toLocaleString()}`})</span>
              </div>
                    ))}
                      </div>
                          </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Financials</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Refunds</span><span className="font-medium">₱{adminSales.refunds.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Discounts</span><span className="font-medium">₱{adminSales.discounts.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Net Income</span><span className="font-bold text-emerald-700">₱{adminSales.netIncome.toLocaleString()}</span></div>
                          </div>
                        </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Top Regions</div>
                  <div className="space-y-1 text-sm">
                    {adminSales.topRegions.slice(0,5).map(r => (
                      <div key={r.name} className="flex justify-between">
                        <span>{r.name}</span>
                        <span className="font-medium">₱{r.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}

              {/* Demographics & Charts */}
              {section === 'customers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Customer Demographics</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>New Customers</span><span className="font-medium">{adminSales.newCustomers}</span></div>
                    <div className="flex justify-between"><span>Returning Customers</span><span className="font-medium">{adminSales.returningCustomers}</span></div>
                        </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Revenue Trend</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getMonthlyAnalytics()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Payments Breakdown</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={(adminSales.paymentMethods || []).map(p => ({ name: p.method, value: p.count }))} dataKey="value" nameKey="name" outerRadius={60}>
                          {adminSales.paymentMethods.map((_, idx) => (
                            <Cell key={idx} fill={["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#6366F1"][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
            </div>
                </div>
              </div>
              )}

              {/* Payouts by Seller (names) */}
              {section === 'payouts' && adminSales.payoutsBySeller.length > 0 && (
                <div className="p-4 border rounded-lg mt-6">
                  <div className="font-semibold mb-2">Payouts Completed</div>
                  <div className="space-y-2 text-sm">
                    {adminSales.payoutsBySeller.slice(0,10).map(p => (
                      <div key={p.sellerId} className="flex justify-between">
                        <span>{p.name }</span>
                        <span className="font-medium">₱{p.amount.toLocaleString()} ({p.count})</span>
                </div>
                    ))}
              </div>
            </div>
              )}

              {/* Charts: Top Sellers, Top Categories, Channels, Payouts */}
              {section === 'sales' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Top Sellers by Revenue</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminSales.topSellers.map(s => ({ name: s.name, revenue: s.revenue }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                        </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Top Categories by Revenue</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={adminSales.byCategory.map(c => ({ name: c.name, value: c.revenue }))} dataKey="value" nameKey="name" outerRadius={70}>
                          {adminSales.byCategory.map((_, idx) => (
                            <Cell key={idx} fill={["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Sales by Channel (Orders vs Revenue)</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminSales.byChannel.map(ch => ({ name: ch.name, orders: ch.orders, revenue: ch.revenue }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="orders" name="Orders" fill="#F59E0B" />
                        <Bar dataKey="revenue" name="Revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {adminSales.payoutsBySeller.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <div className="font-semibold mb-2">Payouts by Seller</div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={adminSales.payoutsBySeller.map(p => ({ name: p.name, amount: p.amount }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="amount" name="Amount" fill="#6366F1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Cumulative Revenue (12 months)</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getMonthlyAnalytics().map((d, idx, arr) => ({ ...d, cumRevenue: arr.slice(0, idx + 1).reduce((s, x) => s + x.revenue, 0) }))}>
                        <defs>
                          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="cumRevenue" name="Cumulative Revenue" stroke="#10B981" fillOpacity={1} fill="url(#revGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                        </div>
                      </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Payment Methods (Revenue Radar)</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={adminSales.paymentMethods.map(pm => ({ method: pm.method, revenue: pm.revenue }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="method" />
                        <PolarRadiusAxis />
                        <Radar name="Revenue" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                      </div>
                    </div>
              </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => exportAdminSalesCSV()}>
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
                <Button variant="outline" onClick={() => generateAdminSalesPDF()}>
                  <FileText className="w-4 h-4 mr-2" /> Export PDF
                </Button>
                </div>
              </CardContent>
            </Card>
        )}
        
      </motion.div>
     
    </motion.div>
  );
}



