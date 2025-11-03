import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";

// Memoized input component to prevent unnecessary re-renders
const FormInput = memo(({ 
  id, 
  label, 
  type, 
  value, 
  placeholder, 
  onChange,
  error,
  showPasswordToggle,
  onTogglePassword
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}) => (
  <motion.div 
    className="space-y-2"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
  >
    <Label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <motion.div 
      className="relative"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${showPasswordToggle ? 'pr-10' : ''} ${error ? 'border-red-500' : ''}`}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : "email"}
      />
      <AnimatePresence>
        {showPasswordToggle && (
          <motion.button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={type === 'password' ? 'Show password' : 'Hide password'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {type === 'password' ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </motion.div>
));

FormInput.displayName = "FormInput";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  // Memoized handlers
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (errors.email) setErrors(prev => ({...prev, email: undefined}));
  }, [errors.email]);
  
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (errors.password) setErrors(prev => ({...prev, password: undefined}));
  }, [errors.password]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: {email?: string, password?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Success",
          description: "Welcome back!",
        });
        navigate('/', { replace: true });
      } else {
        toast({
          title: "Error",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, validateForm, login, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]" />
      </motion.div>
      
      {isLoading && (
        <motion.div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader />
          </motion.div>
        </motion.div>
      )}
      
      <motion.div 
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="text-center space-y-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
              <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Log In</CardTitle>
              <p className="text-sm text-gray-600">Hello Admin! Please log in to continue</p>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormInput
                      id="email"
                      label="Email"
                      type="email"
                      value={email}
                      placeholder="email"
                      onChange={handleEmailChange}
                      error={errors.email}
                    />
                  </motion.div>
                  
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <FormInput
                      id="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      placeholder="••••••••"
                      onChange={handlePasswordChange}
                      error={errors.password}
                      showPasswordToggle={true}
                      onTogglePassword={togglePasswordVisibility}
                    />
                  </motion.div>
                </AnimatePresence>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Button
                    type="submit"
                    className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}