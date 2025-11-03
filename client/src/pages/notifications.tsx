import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  UserPlus 
} from "lucide-react";
import { notificationsData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  info: "bg-blue-100 text-blue-600",
  success: "bg-green-100 text-green-600",
  warning: "bg-yellow-100 text-yellow-600",
  error: "bg-red-100 text-red-600",
};

export default function Notifications() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const handleSettingChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6 custom-scrollbar"
    >
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-yellow-100 dark:border-slate-700"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full blur-2xl"></div>
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
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  {notificationsData.length} alerts
                </Badge>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-slate-600 dark:text-slate-300 text-lg"
              >
                Stay updated with important alerts and messages
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-yellow-200 dark:border-slate-600 shadow-sm">
                <CheckCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {notificationsData.filter(n => !n.isRead).length} unread
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Recent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-stone-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-stone-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-900">Recent Notifications</CardTitle>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="secondary" size="sm" className="transition-all duration-200">
                    Mark all as read
                  </Button>
                </motion.div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="divide-y divide-stone-200">
                <AnimatePresence>
                  {notificationsData.map((notification, index) => {
                    const Icon = iconMap[notification.type];
                    
                    return (
                      <motion.div 
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ backgroundColor: "rgb(250 250 249)", transition: { duration: 0.2 } }}
                        className="p-6 transition-colors duration-200"
                      >
                        <div className="flex">
                          <motion.div 
                            className="flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              colorMap[notification.type]
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </motion.div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-normal text-stone-900">{notification.title}</p>
                              <span className="text-xs text-stone-500">{notification.time}</span>
                            </div>
                            <p className="text-sm text-stone-600 mt-1">{notification.message}</p>
                          </div>
                          {!notification.isRead && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                              className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-2" 
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-stone-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-900">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-normal text-stone-900">Email notifications</p>
                    <p className="text-sm text-stone-500">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleSettingChange('emailNotifications')}
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-normal text-stone-900">Push notifications</p>
                    <p className="text-sm text-stone-500">Receive push notifications in browser</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={() => handleSettingChange('pushNotifications')}
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-normal text-stone-900">SMS notifications</p>
                    <p className="text-sm text-stone-500">Receive important updates via SMS</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={() => handleSettingChange('smsNotifications')}
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
