import { useState, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

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
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <div className="relative">
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
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={type === 'password' ? 'Show password' : 'Hide password'}
        >
          {type === 'password' ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg border border-black-200">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Log In</CardTitle>
            <p className="text-sm text-gray-600">Hello Admin! Please log in to continue</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                id="email"
                label="Email"
                type="email"
                value={email}
                
                placeholder="email"
               
                onChange={handleEmailChange}
                error={errors.email}
              />
              
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

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}