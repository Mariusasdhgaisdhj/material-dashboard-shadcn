import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Calendar, 
  Sun, 
  Moon, 
  Cloud, 
  CloudRain,
  CloudSnow,
  Zap
} from "lucide-react";

export function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getWeatherIcon = () => {
    const hour = currentTime.getHours();
    const isDay = hour >= 6 && hour < 18;
    
    // Simple weather simulation based on time
    const weatherTypes = ['sunny', 'cloudy', 'rainy', 'snowy'];
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    switch (randomWeather) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-5 h-5 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'snowy':
        return <CloudSnow className="w-5 h-5 text-blue-300" />;
      default:
        return isDay ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 20) return "Evening";
    return "Night";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {getGreeting()}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getTimeOfDay()} • {formatShortDate(currentTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getWeatherIcon()}
              
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <motion.div
                key={currentTime.getTime()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold text-slate-900 dark:text-white mb-1"
              >
                {formatTime(currentTime)}
              </motion.div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formatDate(currentTime)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>Week {Math.ceil(currentTime.getDate() / 7)}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Zap className="w-3 h-3" />
                <span>Day {currentTime.getDay() === 0 ? 7 : currentTime.getDay()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
