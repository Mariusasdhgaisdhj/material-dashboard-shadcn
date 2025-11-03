import { HashRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { ThemeConfigurator } from "@/components/theme-configurator";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, Suspense, lazy } from "react";
import { initOneSignal } from "@/onesignal";
import SidebarToggle from "./components/SidebarToggle";

// Lazy load pages to reduce initial bundle size
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const Tables = lazy(() => import("@/pages/tables"));
const Orders = lazy(() => import("@/pages/orders"));
const Categories = lazy(() => import("@/pages/categories"));
const Payments = lazy(() => import("@/pages/payments"));
const Messages = lazy(() => import("@/pages/messages"));
const Forum = lazy(() => import("@/pages/forum"));
const Reports = lazy(() => import("@/pages/reports"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Subscriptions = lazy(() => import("@/pages/subscriptions"));
const Documentation = lazy(() => import("@/pages/documentation"));
const SignIn = lazy(() => import("@/pages/auth/sign-in"));
const SignUp = lazy(() => import("@/pages/auth/sign-up"));
const Users = lazy(() => import("@/pages/users"));
const Products = lazy(() => import("@/pages/products"));
const DynamicNavigationDemo = lazy(() => import("@/pages/dynamic-navigation-demo"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PayoutSuccess = lazy(() => import("@/pages/payouts/success"));
const PayoutFailed = lazy(() => import("@/pages/payouts/failed"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);




function Layout({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);

  return (
    
    <div className="flex h-screen bg-black-50 grain-texture ">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-10
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <main className="flex-1 overflow-y-auto p-3 lg:p-6 relative z-10 flex flex-col">
        {/* Mobile header with burger menu */}
        <div className="lg:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        {/* Desktop sidebar collapse via title click; separate button removed */}
        
        <Card className="flex-1 border border-stone-200 bg-white relative z-20">
          {title && (
            <div className="pt-6 px-3 lg:px-6 pb-4">
       
              
              <h1 className="text-xl font-semibold text-stone-900 mb-1">{title}</h1>
              {description && (
                <p className="text-sm text-stone-600">{description}</p>
              )}
              <div className="border-b border-stone-200 mt-4"></div>
            </div>
          )}
          {children}
        </Card>
        <Footer />
      </main>
      
      {/* Theme Configurator Modal - Outside sidebar for proper z-index */}
      <ThemeConfigurator 
        isOpen={themeConfigOpen} 
        onClose={() => setThemeConfigOpen(false)} 
      />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout >
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Layout>
            <Users />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute>
          <Layout >
            <Products />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/tables" element={
        <ProtectedRoute>
          <Layout>
            <Tables />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <Layout>
            <Orders />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute>
          <Layout>
            <Categories />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <Layout >
            <Payments />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <Layout>
            <Messages />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/forum" element={
        <ProtectedRoute>
          <Layout >
            <Forum />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout title="Notifications" description="Stay updated with your latest alerts and messages">
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/subscriptions" element={
        <ProtectedRoute>
          <Layout title="Subscriptions" description="Manage your billing, plans, and subscription settings">
            <Subscriptions />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/documentation" element={
        <ProtectedRoute>
          <Layout title="Documentation" description="Installation guide, component examples, and project information">
            <Documentation />
          </Layout>
        </ProtectedRoute>
      } />
 
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/payouts/success" element={<PayoutSuccess />} />
      <Route path="/payouts/failed" element={<PayoutFailed />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    try { initOneSignal(); } catch {}
  }, []);
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </NavigationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  );
}

export default App;
