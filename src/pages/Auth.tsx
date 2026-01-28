import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Package, 
  Loader2, 
  Eye, 
  EyeOff, 
  Warehouse, 
  TrendingUp, 
  Shield, 
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  emailSchema, 
  validatePasswordPolicy, 
  getPasswordStrength 
} from '@/lib/validation/schemas';

const features = [
  { icon: Warehouse, title: 'Inventory Management', description: 'Real-time stock tracking and control' },
  { icon: TrendingUp, title: 'Financial Control', description: 'Complete AP/AR and GL integration' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Insights and reporting at a glance' },
  { icon: Shield, title: 'Enterprise Security', description: 'Role-based access and audit trails' },
];

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, location]);

  const handleForgotPassword = () => {
    toast.info('Password reset functionality coming soon. Please contact your administrator.');
  };

  // Password strength for signup
  const passwordErrors = useMemo(() => {
    return validatePasswordPolicy(signupPassword);
  }, [signupPassword]);
  
  const passwordStrength = useMemo(() => {
    return getPasswordStrength(signupPassword);
  }, [signupPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(loginEmail);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }
    
    if (!loginPassword) {
      toast.error('Password is required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email before signing in');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }
    
    // Enforce SAP-compatible password policy
    if (passwordErrors.length > 0) {
      toast.error(`Password requirements: ${passwordErrors[0]}`);
      return;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in.');
        setActiveTab('login');
        setLoginEmail(signupEmail);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! Please check your email to confirm.');
      setActiveTab('login');
      setLoginEmail(signupEmail);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          {/* Logo and Title */}
          <div className="mb-12">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Package className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-3">WMS Pro</h1>
            <p className="text-xl text-white/80">Enterprise Warehouse Management System</p>
          </div>
          
          {/* Feature Highlights */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-sm text-white/60">
              Trusted by enterprises worldwide for efficient warehouse operations.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-primary rounded-xl items-center justify-center mb-4">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">WMS Pro</h1>
            <p className="text-muted-foreground text-sm">Enterprise Warehouse Management</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-muted rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'signup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 font-medium transition-all duration-200 hover:scale-[1.02]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className="text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  Create one now
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">
                  Work Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
                <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password Requirements Checklist */}
                {signupPassword && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Password strength:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center gap-1 ${signupPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {signupPassword.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${/[A-Z]/.test(signupPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {/[A-Z]/.test(signupPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Uppercase
                      </div>
                      <div className={`flex items-center gap-1 ${/[a-z]/.test(signupPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {/[a-z]/.test(signupPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Lowercase
                      </div>
                      <div className={`flex items-center gap-1 ${/[0-9]/.test(signupPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {/[0-9]/.test(signupPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Number
                      </div>
                      <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(signupPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {/[^A-Za-z0-9]/.test(signupPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Special char
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {signupConfirmPassword && signupPassword === signupConfirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 font-medium transition-all duration-200 hover:scale-[1.02]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  Sign in instead
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
