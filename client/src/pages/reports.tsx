import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getJson, apiUrl } from "@/lib/api";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [emailFilter, setEmailFilter] = useState('');
  const [exportType, setExportType] = useState('csv');
  const [reportType, setReportType] = useState('orders');

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
  
  // Generate report templates based on data
  const reportTemplates = [
    { name: 'ADMIN REPORT-ORDERS', id: 'orders', count: orders.length },
    { name: 'ADMIN REPORT-PRODUCTS', id: 'products', count: products.length },
    { name: 'ADMIN REPORT-USERS', id: 'users', count: users.length },
    { name: 'ADMIN REPORT-CATEGORIES', id: 'categories', count: categories.length },
    { name: 'ADMIN REPORT-PAYMENTS', id: 'payments', count: orders.filter(o => o.paymentMethod).length },
    { name: 'ADMIN REPORT-REVENUE', id: 'revenue', count: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) },
    { name: 'ADMIN REPORT-SUMMARY', id: 'summary', count: orders.length + products.length + users.length },
  ];

  const handleSearch = () => {
    // Filter logic would go here
    console.log('Searching with:', { sortOrder, emailFilter, reportType });
    toast({
      title: "Search Applied",
      description: `Filtered reports by ${emailFilter ? `email: ${emailFilter}` : 'all data'} in ${sortOrder} order`,
    });
  };

  const generatePDF = (template: any) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(template.name, 20, 20);
    
    // Add report details
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Report ID: ${348575 - reportTemplates.indexOf(template)}`, 20, 45);
    
    // Add data based on template type
    let tableData: any[] = [];
    let headers: string[] = [];
    
    switch (template.id) {
      case 'orders':
        headers = ['Order ID', 'Customer', 'Status', 'Total', 'Payment Method', 'Date'];
        tableData = orders.map(order => [
          order._id?.substring(0, 8) + '...',
          order.userID?.name || 'Unknown',
          order.orderStatus || 'pending',
          `₱${order.totalPrice?.toFixed(2) || '0.00'}`,
          order.paymentMethod || 'Unknown',
          order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'
        ]);
        break;
      case 'products':
        headers = ['Product ID', 'Name', 'Price', 'Category', 'Stock', 'Seller'];
        tableData = products.map(product => [
          product._id?.substring(0, 8) + '...',
          product.name || 'Unknown',
          `₱${product.price?.toFixed(2) || '0.00'}`,
          product.category?.name || 'Unknown',
          product.stock || 0,
          product.seller?.businessName || 'Unknown'
        ]);
        break;
      case 'users':
        headers = ['User ID', 'Name', 'Email', 'Role', 'Verified', 'Join Date'];
        tableData = users.map(user => [
          user._id?.substring(0, 8) + '...',
          user.name || 'Unknown',
          user.email || 'Unknown',
          user.role || 'buyer',
          user.verified ? 'Yes' : 'No',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'
        ]);
        break;
      case 'payments':
        headers = ['Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Reference'];
        tableData = orders.filter(o => o.paymentMethod).map(order => [
          order._id?.substring(0, 8) + '...',
          order.userID?.name || 'Unknown',
          `₱${order.totalPrice?.toFixed(2) || '0.00'}`,
          order.paymentMethod || 'Unknown',
          order.orderStatus || 'pending',
          order.referenceNumber || '-'
        ]);
        break;
      default:
        headers = ['Metric', 'Value'];
        tableData = [
          ['Total Orders', orders.length],
          ['Total Products', products.length],
          ['Total Users', users.length],
          ['Total Revenue', `₱${orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}`]
        ];
    }
    
    // Add table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 60,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] }
    });
    
    // Save PDF
    doc.save(`${template.name.replace('ADMIN REPORT-', '').toLowerCase()}_report.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `${template.name} report has been downloaded`,
    });
  };

  const handleExport = () => {
    if (exportType === 'pdf') {
      // Generate comprehensive PDF report
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('AgriGrow Admin Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);
      
      // Summary statistics
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Orders', orders.length],
        ['Total Products', products.length],
        ['Total Users', users.length],
        ['Total Revenue', `₱${orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}`],
        ['Average Order Value', `₱${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) / orders.length).toFixed(2) : '0.00'}`]
      ];
      
      autoTable(doc, {
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94] }
      });
      
      doc.save('agrigrow_comprehensive_report.pdf');
      
      toast({
        title: "Export Complete",
        description: "Comprehensive report exported as PDF",
      });
    } else if (exportType === 'csv') {
      // Generate CSV export
      const csvData = reportTemplates.map(template => ({
        'Template Name': template.name,
        'C_COID': 1 - reportTemplates.indexOf(template),
        'Count': template.count,
        'Generated Date': new Date().toISOString()
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agrigrow_reports.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Reports data exported as CSV",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Admin Report View Detail</CardTitle>
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
            <CardTitle className="text-lg font-semibold text-stone-900">Admin Report View Detail</CardTitle>
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
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
          <CardTitle className="text-lg font-semibold text-stone-900">Admin Report View Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          {/* Controls Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Sort Order */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort Order</Label>
              <div className="flex space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="asc"
                    checked={sortOrder === 'asc'}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="text-green-600"
                  />
                  <span className="text-sm">Asc</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="desc"
                    checked={sortOrder === 'desc'}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="text-green-600"
                  />
                  <span className="text-sm">Desc</span>
                </label>
              </div>
      </div>

            {/* Email Filter */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address:</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="text-sm"
              />
      </div>

            {/* Search Button */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-transparent">Search</Label>
              <Button onClick={handleSearch} className="w-full bg-green-600 hover:bg-green-700">
                Search →
              </Button>
            </div>

            {/* Export Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type:</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-transparent">Export</Label>
              <Button onClick={handleExport} className="w-full bg-green-600 hover:bg-green-700">
                Export →
              </Button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-md">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Template Name</th>
             
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {reportTemplates.map((template, index) => (
                  <tr key={template.id} className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-4 py-3 text-sm text-stone-900">{template.name}</td>
                    
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="secondary"
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                        onClick={() => generatePDF(template)}
                      >
                        pdf
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
