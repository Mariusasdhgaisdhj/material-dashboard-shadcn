import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// Enhanced NavItem interface with more dynamic properties
export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon | string; // Allow string for dynamic icon loading
  group?: string;
  badgeCount?: number;
  isVisible?: boolean;
  isEnabled?: boolean;
  order?: number;
  permissions?: string[];
  children?: NavItem[];
  onClick?: () => void;
  external?: boolean;
  description?: string;
  keywords?: string[]; // For better search functionality
}

// Navigation configuration interface
export interface NavigationConfig {
  items: NavItem[];
  defaultOpenGroups?: string[];
  searchEnabled?: boolean;
  groupCollapsible?: boolean;
  showBadges?: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

// Context interface
interface NavigationContextType {
  // State
  navItems: NavItem[];
  searchTerm: string;
  openSections: Set<string>;
  filteredItems: NavItem[];
  groupedItems: Record<string, NavItem[]>;
  
  // Actions
  setNavItems: (items: NavItem[]) => void;
  addNavItem: (item: NavItem, parentId?: string) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  removeNavItem: (id: string) => void;
  reorderNavItems: (itemIds: string[]) => void;
  
  // Search
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  
  // Groups
  toggleSection: (group: string) => void;
  setOpenSections: (sections: Set<string>) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  
  // Badges
  updateBadgeCount: (itemId: string, count: number) => void;
  incrementBadgeCount: (itemId: string, increment?: number) => void;
  decrementBadgeCount: (itemId: string, decrement?: number) => void;
  
  // Visibility
  toggleItemVisibility: (itemId: string) => void;
  setItemVisibility: (itemId: string, visible: boolean) => void;
  
  // Configuration
  updateConfig: (config: Partial<NavigationConfig>) => void;
  resetToDefault: () => void;
}

// Default navigation items
const defaultNavItems: NavItem[] = [
  { 
    id: 'dashboard', 
    title: "Dashboard", 
    href: "/", 
    icon: "LayoutDashboard",
    order: 1,
    isVisible: true,
    isEnabled: true,
    keywords: ['home', 'main', 'overview']
  },
  
  {
    id: 'users',
    title: "Users",
    href: "/users",
    icon: "Users",
    group: "Management",
    order: 3,
    badgeCount: 0,
    isVisible: true,
    isEnabled: true,
    keywords: ['user management', 'accounts', 'people']
  },
  {
    id: 'products',
    title: "Products",
    href: "/products",
    icon: "Boxes",
    group: "Management",
    order: 4,
    badgeCount: 0,
    isVisible: true,
    isEnabled: true,
    keywords: ['inventory', 'items', 'catalog']
  },
  {
    id: 'orders',
    title: "Orders",
    href: "/orders",
    icon: "Table",
    group: "Management",
    order: 5,
    badgeCount: 0,
    isVisible: true,
    isEnabled: true,
    keywords: ['transactions', 'sales', 'purchases']
  },
  {
    id: 'categories',
    title: "Categories",
    href: "/categories",
    icon: "Table",
    group: "Management",
    order: 6,
    badgeCount: 0,
    isVisible: true,
    isEnabled: true,
    keywords: ['classification', 'types', 'groups']
  },
  { 
    id: 'payments', 
    title: "Payments", 
    href: "/payments", 
    icon: "CreditCard", 
    group: "Finance",
    order: 7,
    isVisible: true,
    isEnabled: true,
    keywords: ['billing', 'money', 'transactions']
  },
  {
    id: 'forum',
    title: "Forum",
    href: "/forum",
    icon: "BookOpen",
    group: "Communication",
    order: 8,
    isVisible: true,
    isEnabled: true,
    keywords: ['discussion', 'community', 'chat']
  },
  { 
    id: 'reports', 
    title: "Reports", 
    href: "/reports", 
    icon: "BarChart3", 
    group: "Analytics",
    order: 9,
    isVisible: true,
    isEnabled: true,
    keywords: ['analytics', 'statistics', 'data']
  },
  {
    id: 'messages',
    title: "Messages",
    href: "/messages",
    icon: "MessageCircle",
    group: "Communication",
    order: 10,
    badgeCount: 0,
    isVisible: true,
    isEnabled: true,
    keywords: ['chat', 'notifications', 'alerts']
  },
 
];

// Create context
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Provider component
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navItems, setNavItemsState] = useState<NavItem[]>(defaultNavItems);
  const [searchTerm, setSearchTermState] = useState("");
  const [openSections, setOpenSectionsState] = useState<Set<string>>(new Set(["Management"]));

  // Filter items based on search term and visibility
  const filteredItems = React.useMemo(() => {
    return navItems
      .filter(item => item.isVisible !== false)
      .filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          item.title.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.keywords?.some(keyword => keyword.toLowerCase().includes(term)) ||
          item.group?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [navItems, searchTerm]);

  // Group the filtered items
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, NavItem[]> = {};
    filteredItems.forEach((item) => {
      if (item.group) {
        if (!groups[item.group]) groups[item.group] = [];
        groups[item.group].push(item);
      } else {
        if (!groups["Ungrouped"]) groups["Ungrouped"] = [];
        groups["Ungrouped"].push(item);
      }
    });
    return groups;
  }, [filteredItems]);

  // Navigation item management
  const addNavItem = useCallback((item: NavItem, parentId?: string) => {
    if (parentId) {
      setNavItemsState(prev => prev.map(parent => 
        parent.id === parentId 
          ? { ...parent, children: [...(parent.children || []), item] }
          : parent
      ));
    } else {
      setNavItemsState(prev => [...prev, item]);
    }
  }, []);

  const updateNavItem = useCallback((id: string, updates: Partial<NavItem>) => {
    setNavItemsState(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeNavItem = useCallback((id: string) => {
    setNavItemsState(prev => prev.filter(item => item.id !== id));
  }, []);

  const reorderNavItems = useCallback((itemIds: string[]) => {
    setNavItemsState(prev => {
      const reorderedItems = itemIds.map(id => 
        prev.find(item => item.id === id)
      ).filter(Boolean) as NavItem[];
      
      const remainingItems = prev.filter(item => !itemIds.includes(item.id));
      return [...reorderedItems, ...remainingItems];
    });
  }, []);

  // Search functions
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTermState("");
  }, []);

  // Group management
  const toggleSection = useCallback((group: string) => {
    setOpenSectionsState(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  }, []);

  const setOpenSections = useCallback((sections: Set<string>) => {
    setOpenSectionsState(sections);
  }, []);

  const expandAllGroups = useCallback(() => {
    const allGroups = Object.keys(groupedItems);
    setOpenSectionsState(new Set(allGroups));
  }, [groupedItems]);

  const collapseAllGroups = useCallback(() => {
    setOpenSectionsState(new Set());
  }, []);

  // Badge management
  const updateBadgeCount = useCallback((itemId: string, count: number) => {
    updateNavItem(itemId, { badgeCount: count });
  }, [updateNavItem]);

  const incrementBadgeCount = useCallback((itemId: string, increment = 1) => {
    setNavItemsState(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, badgeCount: (item.badgeCount || 0) + increment }
        : item
    ));
  }, []);

  const decrementBadgeCount = useCallback((itemId: string, decrement = 1) => {
    setNavItemsState(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, badgeCount: Math.max(0, (item.badgeCount || 0) - decrement) }
        : item
    ));
  }, []);

  // Visibility management
  const toggleItemVisibility = useCallback((itemId: string) => {
    setNavItemsState(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isVisible: !item.isVisible }
        : item
    ));
  }, []);

  const setItemVisibility = useCallback((itemId: string, visible: boolean) => {
    updateNavItem(itemId, { isVisible: visible });
  }, [updateNavItem]);

  // Configuration management
  const updateConfig = useCallback((config: Partial<NavigationConfig>) => {
    if (config.items) {
      setNavItemsState(config.items);
    }
    if (config.defaultOpenGroups) {
      setOpenSectionsState(new Set(config.defaultOpenGroups));
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setNavItemsState(defaultNavItems);
    setSearchTermState("");
    setOpenSectionsState(new Set(["Management"]));
  }, []);

  const value: NavigationContextType = {
    // State
    navItems,
    searchTerm,
    openSections,
    filteredItems,
    groupedItems,
    
    // Actions
    setNavItems: setNavItemsState,
    addNavItem,
    updateNavItem,
    removeNavItem,
    reorderNavItems,
    
    // Search
    setSearchTerm,
    clearSearch,
    
    // Groups
    toggleSection,
    setOpenSections,
    expandAllGroups,
    collapseAllGroups,
    
    // Badges
    updateBadgeCount,
    incrementBadgeCount,
    decrementBadgeCount,
    
    // Visibility
    toggleItemVisibility,
    setItemVisibility,
    
    // Configuration
    updateConfig,
    resetToDefault,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// Hook to use navigation context
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Hook for dynamic icon loading
export const useDynamicIcon = (iconName: string | LucideIcon): LucideIcon => {
  const [IconComponent, setIconComponent] = useState<LucideIcon | null>(null);

  React.useEffect(() => {
    if (typeof iconName === 'string') {
      // Dynamic import for Lucide icons
      import('lucide-react').then((icons) => {
        const Icon = icons[iconName as keyof typeof icons] as LucideIcon;
        if (Icon) {
          setIconComponent(() => Icon);
        }
      }).catch(() => {
        // Fallback to a default icon if the specified icon doesn't exist
        import('lucide-react').then((icons) => {
          setIconComponent(() => icons.Circle);
        });
      });
    } else {
      setIconComponent(() => iconName);
    }
  }, [iconName]);

  return IconComponent || (() => null) as unknown as LucideIcon;
};
