import { StatsGrid } from "@/components/dashboard/stats-grid";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { ChartsShowcase } from "@/components/dashboard/charts-showcase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  
  // Handle backend response format: { success: true, data: [...] }
  const productsCount = products?.success && Array.isArray(products.data) ? products.data.length : 0;
  const usersCount = users?.success && Array.isArray(users.data) ? users.data.length : 0;
  const ordersCount = orders?.success && Array.isArray(orders.data) ? orders.data.length : 0;
  
  const isLoading = productsLoading || usersLoading || ordersLoading;
  
  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
   


      <StatsGrid />
      <ProjectsTable />
      <ChartsShowcase />
    </div>
  );
}
