import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  GripVertical,
  Bell,
  Lock,
  Unlock
} from 'lucide-react';
import { useNavigation, NavItem } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';

// Available icon options for dynamic selection
const AVAILABLE_ICONS = [
  'LayoutDashboard', 'User', 'Users', 'Boxes', 'Table', 'CreditCard',
  'BookOpen', 'BarChart3', 'MessageCircle', 'Bell', 'Settings', 'Home',
  'Search', 'Filter', 'Download', 'Upload', 'Edit', 'Trash2', 'Plus',
  'Minus', 'Check', 'X', 'ArrowRight', 'ArrowLeft', 'ChevronDown',
  'ChevronUp', 'ChevronRight', 'ChevronLeft', 'Menu', 'MoreHorizontal',
  'MoreVertical', 'Star', 'Heart', 'Bookmark', 'Share', 'Copy', 'Link',
  'ExternalLink', 'Calendar', 'Clock', 'MapPin', 'Mail', 'Phone',
  'Camera', 'Image', 'File', 'Folder', 'Database', 'Server', 'Cloud',
  'Wifi', 'Bluetooth', 'Battery', 'Volume', 'Play', 'Pause', 'Stop',
  'SkipForward', 'SkipBack', 'Repeat', 'Shuffle', 'Mic', 'MicOff',
  'Video', 'VideoOff', 'Monitor', 'Smartphone', 'Tablet', 'Laptop',
  'Desktop', 'Printer', 'Scanner', 'Headphones', 'Speaker', 'Gamepad2',
  'Mouse', 'Keyboard', 'HardDrive', 'Cpu', 'MemoryStick', 'Wrench',
  'Tool', 'Hammer', 'Screwdriver', 'Cog', 'Gear', 'Sliders', 'ToggleLeft',
  'ToggleRight', 'Power', 'Zap', 'Sun', 'Moon', 'Cloud', 'CloudRain',
  'CloudSnow', 'CloudLightning', 'Wind', 'Thermometer', 'Droplets',
  'Umbrella', 'Shield', 'ShieldCheck', 'ShieldAlert', 'ShieldX',
  'Lock', 'Unlock', 'Key', 'Fingerprint', 'Scan', 'QrCode', 'Barcode',
  'CreditCard', 'Wallet', 'Banknote', 'Coins', 'Receipt', 'ShoppingCart',
  'ShoppingBag', 'Package', 'Truck', 'Car', 'Bike', 'Plane', 'Train',
  'Ship', 'Map', 'Navigation', 'Compass', 'Target', 'Crosshair',
  'Focus', 'Zap', 'Flashlight', 'Lamp', 'Lightbulb', 'Candle',
  'Flame', 'Fire', 'Sparkles', 'Star', 'Heart', 'Smile', 'Frown',
  'Meh', 'ThumbsUp', 'ThumbsDown', 'Hand', 'Handshake', 'Users',
  'User', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'UserCog',
  'Crown', 'Award', 'Trophy', 'Medal', 'Ribbon', 'Flag', 'Bookmark',
  'Tag', 'Label', 'Hash', 'AtSign', 'Percent', 'DollarSign',
  'Euro', 'Pound', 'Yen', 'Bitcoin', 'TrendingUp', 'TrendingDown',
  'Activity', 'Pulse', 'Heartbeat', 'Lungs', 'Brain', 'Eye',
  'Ear', 'Nose', 'Mouth', 'Tooth', 'Bone', 'Skull', 'Cross',
  'Plus', 'Minus', 'Multiply', 'Divide', 'Equal', 'NotEqual',
  'GreaterThan', 'LessThan', 'GreaterThanOrEqual', 'LessThanOrEqual',
  'Infinity', 'Pi', 'Sigma', 'Alpha', 'Beta', 'Gamma', 'Delta',
  'Omega', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Rho', 'Tau',
  'Phi', 'Chi', 'Psi', 'Omega'
];

interface NavigationManagerProps {
  className?: string;
}

export const NavigationManager: React.FC<NavigationManagerProps> = ({ className }) => {
  const {
    navItems,
    addNavItem,
    updateNavItem,
    removeNavItem,
    updateBadgeCount,
    toggleItemVisibility,
    setItemVisibility,
    expandAllGroups,
    collapseAllGroups,
    resetToDefault,
  } = useNavigation();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<NavItem>>({
    title: '',
    href: '',
    icon: 'Circle',
    group: '',
    badgeCount: 0,
    isVisible: true,
    isEnabled: true,
    order: navItems.length + 1,
    keywords: [],
  });

  const handleAddItem = () => {
    if (newItem.title && newItem.href) {
      addNavItem(newItem as NavItem);
      setNewItem({
        title: '',
        href: '',
        icon: 'Circle',
        group: '',
        badgeCount: 0,
        isVisible: true,
        isEnabled: true,
        order: navItems.length + 1,
        keywords: [],
      });
      setIsAddingItem(false);
    }
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      updateNavItem(editingItem.id, editingItem);
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    removeNavItem(id);
  };

  const handleBadgeUpdate = (id: string, count: number) => {
    updateBadgeCount(id, count);
  };

  const groupedItems = navItems.reduce((groups, item) => {
    const group = item.group || 'Ungrouped';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, NavItem[]>);

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dynamic Navigation Manager
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllGroups}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAllGroups}
            >
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Item Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add New Navigation Item</h3>
            <Button
              onClick={() => setIsAddingItem(!isAddingItem)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAddingItem ? 'Cancel' : 'Add Item'}
            </Button>
          </div>

          <AnimatePresence>
            {isAddingItem && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="Navigation item title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="href">URL</Label>
                    <Input
                      id="href"
                      value={newItem.href}
                      onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
                      placeholder="/path"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={typeof newItem.icon === 'string' ? newItem.icon : 'Circle'}
                      onValueChange={(value) => setNewItem({ ...newItem, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="group">Group</Label>
                    <Input
                      id="group"
                      value={newItem.group}
                      onChange={(e) => setNewItem({ ...newItem, group: e.target.value })}
                      placeholder="Group name (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="badgeCount">Badge Count</Label>
                    <Input
                      id="badgeCount"
                      type="number"
                      value={newItem.badgeCount}
                      onChange={(e) => setNewItem({ ...newItem, badgeCount: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={newItem.order}
                      onChange={(e) => setNewItem({ ...newItem, order: parseInt(e.target.value) || 0 })}
                      min="1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVisible"
                      checked={newItem.isVisible}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isVisible: checked })}
                    />
                    <Label htmlFor="isVisible">Visible</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={newItem.keywords?.join(', ') || ''}
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) 
                    })}
                    placeholder="search, keywords, tags"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>
                    Add Item
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Navigation Items List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Navigation Items</h3>
          
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <div key={groupName} className="space-y-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                {groupName}
                <Badge variant="secondary">{items.length}</Badge>
              </h4>
              
              <div className="space-y-2 ml-4">
                {items
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          {item.isVisible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          {item.isEnabled ? (
                            <Unlock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.href}</div>
                        </div>
                        {item.badgeCount && item.badgeCount > 0 && (
                          <Badge variant="destructive">{item.badgeCount}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.badgeCount || 0}
                          onChange={(e) => handleBadgeUpdate(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 h-8"
                          min="0"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleItemVisibility(item.id)}
                        >
                          {item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Edit Item Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Navigation Item</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-href">URL</Label>
                    <Input
                      id="edit-href"
                      value={editingItem.href}
                      onChange={(e) => setEditingItem({ ...editingItem, href: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-icon">Icon</Label>
                    <Select
                      value={typeof editingItem.icon === 'string' ? editingItem.icon : 'Circle'}
                      onValueChange={(value) => setEditingItem({ ...editingItem, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-group">Group</Label>
                    <Input
                      id="edit-group"
                      value={editingItem.group || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, group: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-badgeCount">Badge Count</Label>
                    <Input
                      id="edit-badgeCount"
                      type="number"
                      value={editingItem.badgeCount || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, badgeCount: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-order">Order</Label>
                    <Input
                      id="edit-order"
                      type="number"
                      value={editingItem.order || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 0 })}
                      min="1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-isVisible"
                      checked={editingItem.isVisible !== false}
                      onCheckedChange={(checked) => setEditingItem({ ...editingItem, isVisible: checked })}
                    />
                    <Label htmlFor="edit-isVisible">Visible</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="edit-keywords"
                    value={editingItem.keywords?.join(', ') || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) 
                    })}
                    placeholder="search, keywords, tags"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateItem}>
                    Update Item
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
