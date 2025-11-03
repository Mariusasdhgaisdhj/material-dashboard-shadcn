import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SellerProductsModal } from "./seller-products-modal";
import { useState } from "react";
import {
  MoreVertical,
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Eye,
  ExternalLink
} from "lucide-react";

interface ProjectsTableProps {
  users?: any;
  products?: any;
  orders?: any;
}

export function ProjectsTable({ users, products, orders }: ProjectsTableProps) {
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Normalize API responses (handles success wrappers, nested data, etc.)
  const normalize = (res: any) =>
    res?.success
      ? Array.isArray(res.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : []
      : [];

  const usersArr: any[] = normalize(users);
  const productsArr: any[] = normalize(products);
  const ordersArr: any[] = normalize(orders);

  // Fast lookup maps
  const productById: Record<string, any> = {};
  productsArr.forEach((p: any) => { productById[String(p.id || p._id)] = p; });
  const sellerNameById: Record<string, string> = {};
  usersArr.forEach((u: any) => { sellerNameById[String(u.id || u._id)] = u.business_name || u.businessName || u.name || u.email || 'Seller'; });

  // Build business data for all sellers
  const businessData = usersArr
    .filter(
      (u: any) =>
        ["seller", "vendor", "merchant"].includes(u.role) ||
        !!u.business_name ||
        !!u.businessName
    )
    .map((user: any) => {
      const currentUserId = user.id || user._id;

      // Match products belonging to this seller
      const userProducts = productsArr.filter((p: any) => {
        const prodSeller =
          p.seller_id ||
          p.user_id ||
          p.sellerId?._id ||
          p.sellerId ||
          p.userId ||
          p.users?.id ||
          p.users?._id ||
          p.seller?.id ||
          p.seller?._id;
        return prodSeller === currentUserId;
      });

      // Calculate total revenue for this seller
      const revenue = ordersArr.reduce((sum: number, order: any) => {
        const items: any[] = Array.isArray(order.items) ? order.items : [];
        const sellerItemsTotal = items.reduce((sub: number, it: any) => {
          // Normalize product id from item
          let prodId: string | undefined = undefined;
          if (typeof it.productID === 'object' && it.productID) {
            prodId = String(it.productID._id || it.productID.id);
          } else if (it.productID) {
            prodId = String(it.productID);
          } else if (it.product_id) {
            prodId = String(it.product_id);
          }

          const prod = prodId ? productById[prodId] : undefined;
          const prodSeller = prod?.seller_id || prod?.sellerId?._id || prod?.users?.id || prod?.seller?.id;
          const belongsToSeller = prodSeller === currentUserId;
          if (!belongsToSeller) return sub;

          const qty = Number(it.quantity || 1);
          const price = Number(it.price || 0);
          return sub + qty * price;
        }, 0);
        return sum + sellerItemsTotal;
      }, 0);

      const stockCount = userProducts.length;

      return {
        id: currentUserId,
        name: user.business_name || user.businessName || sellerNameById[currentUserId] || "Business",
        owner:
          user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : user.name || "Owner",
        revenue,
        stockCount,
        products: userProducts.map((p: any) => ({
          id: p.id || p._id,
          name: p.name,
          price: p.price
        })),
        completion: Math.min(100, Math.floor((stockCount / 10) * 100))
      };
    })
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5); // Limits to top 5 by revenue

  const handleViewProducts = (business: any) => {
    setSelectedSeller(business);
    setIsModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-100 bg-clip-text text-transparent">
                  Top Businesses
                </CardTitle>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                Showing top 5 businesses by revenue
              </div>
            </div>
          
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Products
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {businessData.length > 0 ? (
                  businessData.map((business: any, index: number) => (
                    <motion.tr 
                      key={business.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mr-3 sm:mr-4 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {business.name}
                            </span>
                            
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white dark:border-slate-800 shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-semibold">
                              {business.owner.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-2 sm:ml-3 hidden sm:block">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {business.owner}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            ₱{business.revenue.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                        <div 
                          className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 cursor-pointer group"
                          onClick={() => handleViewProducts(business)}
                        >
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-slate-500 mr-1 group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {business.stockCount} items
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 max-w-24 sm:max-w-32">
                              <Progress 
                                value={business.completion} 
                                className="h-2 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors"
                              />
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              <Eye className="w-3 h-3" />
                             
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-sm font-medium">No business data available</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Check back later for business information
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Seller Products Modal */}
      <SellerProductsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSeller(null);
        }}
        seller={selectedSeller}
      />
    </motion.div>
  );
}