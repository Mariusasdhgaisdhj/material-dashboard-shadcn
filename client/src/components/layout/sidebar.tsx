import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Table,
  Bell,
  CreditCard,
  BookOpen,
  LogIn,
  UserPlus,
  X,
  BarChart3,
  Users,
  Boxes,
  MessageCircle,
  ChevronDown,
  Leaf,
  Settings,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Activity,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigation, useDynamicIcon, NavItem } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";

// Separate component for navigation items to properly use hooks
function NavigationItem({ item, index }: { item: NavItem; index: number }) {
  const location = useLocation();
  const Icon = useDynamicIcon(item.icon);
  const isActive = location.pathname === item.href;

  return (
    <motion.div
      key={item.href}
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <NavLink
        to={item.href}
        className={({ isActive: linkActive }) =>
          cn(
            "block text-sm font-medium rounded-xl transition-all duration-200 px-4 py-3 relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
            linkActive || isActive
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
              : "text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 hover:shadow-md",
            !item.isEnabled && "opacity-50 cursor-not-allowed"
          )
        }
        onClick={item.onClick}
      >
        {({ isActive: linkActive }) => (
            <motion.div
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center w-full relative",
                (linkActive || isActive) && "text-white"
              )}
            >
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {Icon && (
                  <Icon
                    size={18}
                    strokeWidth={2.5}
                    className={cn("mr-3 flex-shrink-0", (linkActive || isActive) ? "text-white" : "text-green-500 dark:text-green-400")}
                  />
                )}
              </motion.div>
              <span className="truncate flex-1 font-medium">{item.title}</span>

              {(item.badgeCount ?? 0) > 0 && (
                <motion.span
                  className="ml-2 bg-white dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-bold rounded-full px-2.5 py-1 min-w-[1.75rem] flex items-center justify-center shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {item.badgeCount}
                </motion.span>
              )}

              {/* Active indicator bar */}
              {(linkActive || isActive) && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 h-full w-1 bg-white/20 rounded-r-xl"
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 25,
                  }}
                />
              )}
            </motion.div>
        )}
      </NavLink>
    </motion.div>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { user } = useAuth();
  const {
    searchTerm,
    setSearchTerm,
    openSections,
    toggleSection,
    filteredItems,
    groupedItems,
  } = useNavigation();

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="w-full bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900 flex flex-col relative z-10 h-full border-r border-green-200 dark:border-green-700 shadow-lg"
    >
      {/* Header with User Profile */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <motion.div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-bold text-green-900 dark:text-green-100 select-none"
            >
              AgriGrow
            </motion.h1>
          </motion.div>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden p-1 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-100 hover:bg-green-100 dark:hover:bg-green-800"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* User Profile Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user?.firstName || user?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {user?.firstName || user?.username || 'User'}
              </h3>
              <p className="text-green-100 text-sm">
                {user?.title || (user?.isAdmin ? 'Administrator' : 'User')}
              </p>
            </div>
          </div>
          <NavLink to="/profile">
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
            >
              Profile 
            </Button>
          </NavLink>
        </motion.div>
      </div>

     

      {/* Nav Links */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="flex-1 p-4 space-y-1 overflow-y-auto"
      >
        <AnimatePresence>
          {Object.entries(groupedItems).map(([groupName, items], groupIndex) => (
            <motion.div
              key={groupName}
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              {groupName !== "Ungrouped" && (
                <motion.button
                  onClick={() => toggleSection(groupName)}
                  whileHover={{ scale: 1.02 }}
                  className="w-full flex items-center justify-between text-sm font-semibold text-green-700 dark:text-green-300 mb-3 px-4 py-2 rounded-xl bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Leaf className="h-3 w-3" />
                    <span>{groupName}</span>
                  </span>
                  <motion.div
                    animate={{ rotate: openSections.has(groupName) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </motion.button>
              )}

              <AnimatePresence>
                {openSections.has(groupName) || groupName === "Ungrouped" ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    {items.map((item, index) => (
                      <NavigationItem key={item.id} item={item} index={index} />
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </nav>

    </motion.aside>
  );
}