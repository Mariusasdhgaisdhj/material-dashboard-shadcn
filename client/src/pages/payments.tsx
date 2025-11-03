import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaymentApiService, PaymentTransaction, PaymentSearchParams, PaymentStats } from "@/lib/paymentApi";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Search,
  Filter,
  BarChart3,
  FileText,
  RefreshCw,
  Users,
  Package,
  AlertTriangle,
  Zap,
  Shield,
  Settings,
  Archive,
  UserCheck,
  XCircle,
  Send,
  Banknote
} from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function Payments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Search and filter states
  const [searchParams, setSearchParams] = useState<PaymentSearchParams>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    paymentMethod: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });

  // Fetch payments with real API
  const { data: paymentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', searchParams],
    queryFn: () => PaymentApiService.getPayments(searchParams),
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Payments data
  const payments: PaymentTransaction[] = paymentsData?.data || [];
  const totalPayments = paymentsData?.total || 0;

  // UI States
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ 
    type: "view"|"refund"|"dispute"|"bulk-action"|"analytics"|"payout"; 
    id?: string 
  }|null>(null);
  
  // Form states
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");

  // Mutations
  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) => 
      PaymentApiService.processRefund(id, amount, reason, 'admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Success', description: 'Refund processed successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const disputeMutation = useMutation({
    mutationFn: ({ id, reason, evidence }: { id: string; reason: string; evidence?: string[] }) => 
      PaymentApiService.createDispute(id, reason, evidence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Success', description: 'Dispute created successfully' });
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, paymentIds, data }: { action: string; paymentIds: string[]; data?: any }) => 
      PaymentApiService.bulkAction(action, paymentIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Success', description: 'Bulk action completed successfully' });
      setSelectedPayments(new Set());
      setOpen(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Statistics
  const stats: PaymentStats = useMemo(() => {
    return PaymentApiService.calculateStats(payments);
  }, [payments]);

  // Get selected payment for view/edit
  const selectedPayment = useMemo(() => {
    if (!open?.id) return null;
    return payments.find(p => p._id === open.id) || null;
  }, [open, payments]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilter = (key: keyof PaymentSearchParams, value: any) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === "all" ? undefined : value;
    setSearchParams(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    PaymentApiService.exportToCSV(payments);
    toast({ title: 'Success', description: 'Payments exported to CSV' });
  };

  const handleBulkAction = () => {
    if (selectedPayments.size === 0) return;
    bulkActionMutation.mutate({ 
      action: bulkAction, 
      paymentIds: Array.from(selectedPayments) 
    });
  };

  const handleRefund = () => {
    if (open?.id && refundAmount && refundReason) {
      refundMutation.mutate({ 
        id: open.id, 
        amount: parseFloat(refundAmount),
        reason: refundReason
      });
    }
  };

  const handleDispute = () => {
    if (open?.id && disputeReason) {
      disputeMutation.mutate({ 
        id: open.id, 
        reason: disputeReason,
        evidence: disputeEvidence ? [disputeEvidence] : undefined
      });
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    const newSet = new Set(selectedPayments);
    if (newSet.has(paymentId)) {
      newSet.delete(paymentId);
    } else {
      newSet.add(paymentId);
    }
    setSelectedPayments(newSet);
  };

  const toggleAllPayments = () => {
    if (selectedPayments.size === payments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(payments.map(p => p._id)));
    }
  };

  // Initialize form when opening dialogs
  useEffect(() => {
    if (open?.type === 'refund' && selectedPayment) {
      setRefundAmount(String(selectedPayment.amount || 0));
    } else if (open?.type === 'dispute') {
      setDisputeReason('');
      setDisputeEvidence('');
    }
  }, [open, selectedPayment]);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-900">Error Loading Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <p className="text-red-600 mb-4">Failed to load payments. Please try again.</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6 custom-scrollbar"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-100"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex justify-between items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-3 mb-2"
              >
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Payments
                </h1>
                
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-slate-600 text-lg"
              >
                Manage payment transactions and financial operations
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center space-x-2"
            >
              <Button 
                onClick={() => setOpen({ type: 'payout' })}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Seller Payouts
              </Button>
              {selectedPayments.size > 0 && (
                <Button 
                  onClick={() => setOpen({ type: 'bulk-action' })}
                  variant="outline"
                  className="border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Bulk ({selectedPayments.size})
                </Button>
              )}
            </motion.div>
          </div>

         
        </div>
      </motion.div>

      {/* Main Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="border-emerald-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Payment Transactions</CardTitle>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
             
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by payment ID, order ID, or reference..." 
                  value={searchParams.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select 
                value={searchParams.status || 'all'} 
                onValueChange={(v) => handleFilter('status', v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={searchParams.paymentMethod || 'all'} 
                onValueChange={(v) => handleFilter('paymentMethod', v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                 
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setSearchParams({ page: 1, limit: 10, search: '', status: undefined, paymentMethod: undefined })}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {/* Bulk Actions */}
            {selectedPayments.size > 0 && (
              <div className="p-4 bg-red-50 border-b">
                <div className="flex justify-between items-center">
                  <span>{selectedPayments.size} selected</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setOpen({ type: 'bulk-action' })}
                  >
                    Bulk Actions
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox 
                        checked={selectedPayments.size === payments.length && payments.length > 0} 
                        onCheckedChange={toggleAllPayments}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Payment ID</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  <AnimatePresence>
                    {payments.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={9} className="px-6 py-8 text-center text-stone-500">No payments found</td>
                      </motion.tr>
                    ) : (
                      payments.map((payment, idx) => (
                        <motion.tr 
                          key={payment._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.02 }}
                          className="hover:bg-stone-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedPayments.has(payment._id)} 
                              onCheckedChange={() => togglePaymentSelection(payment._id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">
                            {payment._id?.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">
                            {payment.orderId?.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-semibold">
                            ₱{payment.amount?.toLocaleString() || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                            <Badge 
                              variant="secondary" 
                              className={`${
                                payment.paymentMethod?.toLowerCase().includes('gcash') ? 'bg-green-100 text-green-800' :
                                payment.paymentMethod?.toLowerCase().includes('paypal') ? 'bg-blue-100 text-blue-800' :
                                payment.paymentMethod?.toLowerCase().includes('cod') ? 'bg-yellow-100 text-yellow-800' :
                                payment.paymentMethod?.toLowerCase().includes('bank') ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {payment.paymentMethod || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const status = payment.status?.toLowerCase() || 'pending';
                              const colorMap: Record<string, string> = {
                                paid: 'bg-green-100 text-green-800',
                                pending: 'bg-yellow-100 text-yellow-800',
                                failed: 'bg-red-100 text-red-800',
                                refunded: 'bg-purple-100 text-purple-800',
                                disputed: 'bg-orange-100 text-orange-800',
                                cancelled: 'bg-gray-100 text-gray-800'
                              };
                              return (
                                <Badge variant="secondary" className={colorMap[status] || 'bg-slate-100 text-slate-800'}>
                                  {status}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-mono">
                            {payment.referenceNumber || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                            {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-1 flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setOpen({ type: "view", id: payment._id })}
                                title="View Details"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {payment.status === 'paid' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-orange-600 border-orange-300"
                                  onClick={() => {
                                    setRefundAmount(String(payment.amount || 0));
                                    setRefundReason("");
                                    setOpen({ type: "refund", id: payment._id });
                                  }}
                                  title="Process Refund"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              )}
                              {payment.status === 'paid' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 border-red-300"
                                  onClick={() => {
                                    setDisputeReason("");
                                    setDisputeEvidence("");
                                    setOpen({ type: "dispute", id: payment._id });
                                  }}
                                  title="Create Dispute"
                                >
                                  <Shield className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max((searchParams.page || 1) - 1, 1))}
                      className={searchParams.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(totalPayments / (searchParams.limit || 10)) }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => handlePageChange(page)} 
                        isActive={searchParams.page === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min((searchParams.page || 1) + 1, Math.ceil(totalPayments / (searchParams.limit || 10))))}
                      className={searchParams.page === Math.ceil(totalPayments / (searchParams.limit || 10)) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl bg-white border-stone-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {open?.type === "view" && "Payment Details"}
              {open?.type === "refund" && "Process Refund"}
              {open?.type === "dispute" && "Create Dispute"}
              {open?.type === "bulk-action" && "Bulk Action"}
              {open?.type === "analytics" && "Payment Analytics"}
              {open?.type === "payout" && "Payout Management"}
            </DialogTitle>
          </DialogHeader>

          {open?.type === "view" && selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Payment Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Payment ID:</span> {selectedPayment._id}</div>
                    <div><span className="font-medium">Order ID:</span> {selectedPayment.orderId}</div>
                    <div><span className="font-medium">Amount:</span> ₱{selectedPayment.amount?.toLocaleString() || 0}</div>
                    <div><span className="font-medium">Currency:</span> {selectedPayment.currency || 'PHP'}</div>
                  </div>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Transaction Details</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Status:</span> {selectedPayment.status}</div>
                    <div><span className="font-medium">Method:</span> {selectedPayment.paymentMethod}</div>
                    <div><span className="font-medium">Reference:</span> {selectedPayment.referenceNumber || '-'}</div>
                    <div><span className="font-medium">Transaction ID:</span> {selectedPayment.transactionId || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Timeline</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Created:</span> {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : '-'}</div>
                  <div><span className="font-medium">Updated:</span> {selectedPayment.updatedAt ? new Date(selectedPayment.updatedAt).toLocaleString() : '-'}</div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          )}

          {open?.type === "refund" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-700">Process a refund for this payment.</p>
              <div>
                <Label htmlFor="refund-amount">Refund Amount (₱)</Label>
                <Input 
                  id="refund-amount" 
                  type="number"
                  step="0.01"
                  value={refundAmount} 
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="refund-reason">Reason for Refund</Label>
                <Textarea 
                  id="refund-reason"
                  rows={3}
                  value={refundReason} 
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for this refund..."
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">⚠️ This action will refund the specified amount to the original payment method and notify the customer.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleRefund}
                  disabled={refundMutation.isPending || !refundAmount || !refundReason}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "dispute" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-700">Create a dispute for this payment.</p>
              <div>
                <Label htmlFor="dispute-reason">Dispute Reason</Label>
                <Textarea 
                  id="dispute-reason"
                  rows={3}
                  value={disputeReason} 
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Enter reason for this dispute..."
                />
              </div>
              <div>
                <Label htmlFor="dispute-evidence">Evidence (Optional)</Label>
                <Textarea 
                  id="dispute-evidence"
                  rows={2}
                  value={disputeEvidence} 
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Provide any evidence or additional information..."
                />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-800">⚠️ Creating a dispute will mark this payment as disputed and may affect the order status.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleDispute}
                  disabled={disputeMutation.isPending || !disputeReason}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {disputeMutation.isPending ? 'Creating...' : 'Create Dispute'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "bulk-action" && (
            <div className="space-y-4">
              <p className="text-sm">Apply an action to {selectedPayments.size} selected payment(s).</p>
              <div>
                <Label htmlFor="bulk-action-select">Select Action</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an action..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="mark-paid">Mark as Paid</SelectItem>
                    <SelectItem value="mark-failed">Mark as Failed</SelectItem>
                    <SelectItem value="refund">Process Refunds</SelectItem>
                    <SelectItem value="archive">Archive Payments</SelectItem>
                    <SelectItem value="export">Export Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-800">⚠️ This action will affect {selectedPayments.size} payment(s). Please proceed with caution.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
                <Button 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkActionMutation.isPending}
                >
                  {bulkActionMutation.isPending ? 'Processing...' : 'Apply Action'}
                </Button>
              </div>
            </div>
          )}

          {open?.type === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Total Revenue</h3>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">₱{stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">All time</div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Avg Transaction</h3>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">₱{stats.averageTransactionValue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">Per transaction</div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">Success Rate</h3>
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.successRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Successful payments</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Method Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(stats.paymentMethodDistribution).map(([method, data]) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{method}</span>
                        <span className="font-medium">{data.count} payments (₱{data.amount.toLocaleString()})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-600" 
                          style={{ width: `${stats.totalTransactions > 0 ? (data.count / stats.totalTransactions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          )}

          {open?.type === "payout" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <UserCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-emerald-800">Seller Payout Management</h3>
                    <p className="mt-1 text-sm text-emerald-700">
                      Process payouts to sellers via GCash. 100% of order value goes to seller - no platform fees.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Fee Structure</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Platform Fee:</span> ₱0 (Free)</div>
                    <div><span className="font-medium">Seller Receives:</span> 100% of order value</div>
                    <div className="text-xs text-slate-500 mt-2">No fees charged to sellers</div>
                  </div>
                </div>
                
                <div className="border border-emerald-200 rounded-lg p-4 bg-green-50">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Payout Method</h3>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-700">GCash</div>
                      <div className="text-xs text-slate-500">Fast & Secure</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">How to Process Payouts</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                  <li>Navigate to <strong>Orders</strong> page</li>
                  <li>Filter by <strong>Completed</strong> status</li>
                  <li>Select orders from a specific seller</li>
                  <li>Click <strong>Process Payout</strong> button</li>
                  <li>Confirm total amount (100% goes to seller)</li>
                  <li>Get seller's GCash number from their profile</li>
                  <li>Send payment to seller via GCash</li>
                  <li>Mark payout as completed after processing</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs text-green-800">
                  <strong>Note:</strong> Payout information (GCash number) is stored in the seller's profile under "payoutinfo". Ensure sellers have updated their GCash number before processing.
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
                <Button onClick={() => {
                  setOpen(null);
                  navigate('/orders');
                }} className="bg-emerald-600 hover:bg-emerald-700">
                  Go to Orders
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}