import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MoreVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Tables() {
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({ 
    queryKey: ["/users?page=1&limit=20"], 
    queryFn: () => getJson<any>("/users?page=1&limit=20") 
  });
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({ 
    queryKey: ["/products?page=1&limit=20"], 
    queryFn: () => getJson<any>("/products?page=1&limit=20") 
  });
  
  // Handle backend response format: { success: true, data: [...] }
  const authorsData = users?.success && Array.isArray(users.data) ? users.data : [];
  const projectsData = products?.success && Array.isArray(products.data) ? products.data : [];
  
  const isLoading = usersLoading || productsLoading;
  const hasError = usersError || productsError;
  
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader className="border-b border-stone-200">
              <CardTitle className="text-lg font-semibold text-stone-900">Loading...</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-stone-500">Loading data...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader className="border-b border-stone-200">
              <CardTitle className="text-lg font-semibold text-stone-900">Error</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-red-500">Error loading data: {usersError?.message || productsError?.message}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="space-y-6">
        {/* Authors Table */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Users ({authorsData.length})</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      BUSINESS NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      EMPLOYED
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {authorsData.map((author: any) => (
                    <tr key={author.id} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={author.avatar || ""} alt={author.name || author.email} />
                            <AvatarFallback>
                              {(author.name || author.email || "U").toString().split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-normal text-stone-900">{author.name || author.email}</div>
                            <div className="text-sm text-stone-500">{author.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{author.role || (author.verified ? "Verified" : "User")}</div>
                        <div className="text-sm text-stone-500">{author.department || ""}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={'secondary'}
                          className={cn(
                            'bg-stone-100 text-stone-800 hover:bg-stone-100'
                          )}
                        >
                          Active
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        {author.employed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">Products ({projectsData.length})</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      PRODUCT NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      PRICE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      STOCKS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {projectsData.map((p: any) => (
                    <tr key={p.id || p._id} className="hover:bg-stone-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold",
                            'bg-stone-200 text-stone-800'
                          )}>
                            {(p.name || 'P')[0]}
                          </div>
                          <span className="font-normal text-stone-900">{p.name || p.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {p.price ?? p.offerPrice ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          )}
                        >
                          In Catalog
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-stone-600 mr-2">{(p.quantity ?? 0).toString()}</span>
                          <Progress 
                            value={Math.min(100, Number(p.quantity ?? 0))} 
                            className="w-32 h-2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        <Button variant="secondary" size="sm">
                          <MoreVertical className="w-4 h-4" />
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
    </div>
  );
}
