import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Plus, 
  Eye, 
  EyeOff, 
  Bell, 
  Lock, 
  Unlock,
  RotateCcw,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import { NavigationManager } from '@/components/NavigationManager';
import { useNavigation } from '@/contexts/NavigationContext';

export default function DynamicNavigationDemo() {
  const {
    navItems,
    searchTerm,
    setSearchTerm,
    clearSearch,
    incrementBadgeCount,
    decrementBadgeCount,
    toggleItemVisibility,
    expandAllGroups,
    collapseAllGroups,
    resetToDefault,
    groupedItems,
  } = useNavigation();

  const handleQuickActions = () => {
    // Simulate some quick actions
    incrementBadgeCount('messages', 1);
    incrementBadgeCount('orders', 2);
    toggleItemVisibility('forum');
  };

  const handleResetDemo = () => {
    resetToDefault();
    clearSearch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dynamic Navigation System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Fully dynamic sidebar navigation with runtime configuration capabilities
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Zap className="h-3 w-3 mr-1" />
          Dynamic
        </Badge>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold">{navItems.length}</p>
              </div>
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visible Items</p>
                <p className="text-2xl font-bold">
                  {navItems.filter(item => item.isVisible !== false).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Groups</p>
                <p className="text-2xl font-bold">{Object.keys(groupedItems).length}</p>
              </div>
              <Filter className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Badges</p>
                <p className="text-2xl font-bold">
                  {navItems.reduce((sum, item) => sum + (item.badgeCount || 0), 0)}
                </p>
              </div>
              <Bell className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleQuickActions} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Simulate Activity
            </Button>
            <Button onClick={() => incrementBadgeCount('messages', 1)} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Add Message Badge
            </Button>
            <Button onClick={() => decrementBadgeCount('messages', 1)} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Remove Message Badge
            </Button>
            <Button onClick={expandAllGroups} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Expand All Groups
            </Button>
            <Button onClick={collapseAllGroups} variant="outline" size="sm">
              <EyeOff className="h-4 w-4 mr-2" />
              Collapse All Groups
            </Button>
            <Button onClick={handleResetDemo} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search navigation items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button onClick={clearSearch} variant="outline">
                Clear
              </Button>
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found {navItems.filter(item => 
                  item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
                ).length} items matching "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Manager */}
      <NavigationManager />

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Dynamic Navigation Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Implemented Features</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Runtime navigation item addition/removal</li>
                <li>• Dynamic icon loading from Lucide React</li>
                <li>• Real-time badge count updates</li>
                <li>• Item visibility toggling</li>
                <li>• Group-based organization</li>
                <li>• Advanced search with keywords</li>
                <li>• Drag-and-drop reordering</li>
                <li>• Context-based state management</li>
                <li>• Permission-based visibility</li>
                <li>• External link support</li>
                <li>• Custom click handlers</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🚀 Advanced Capabilities</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Nested navigation items</li>
                <li>• Role-based access control</li>
                <li>• Theme customization</li>
                <li>• Animation and transitions</li>
                <li>• Keyboard shortcuts</li>
                <li>• Local storage persistence</li>
                <li>• API integration ready</li>
                <li>• TypeScript support</li>
                <li>• Accessibility compliant</li>
                <li>• Mobile responsive</li>
                <li>• Dark mode support</li>
                <li>• Performance optimized</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
