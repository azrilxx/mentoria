'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { signInUser, DEMO_USER } from '@/lib/firebaseAuth';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your username or email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  // Auto-focus email field on mount
  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  // Watch form values for dynamic validation feedback
  const watchedValues = watch();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signInUser(data.email, data.password);
      
      if (result.success) {
        // Success! Redirect to dashboard
        onSuccess?.();
        router.push('/dashboard');
      } else {
        setAuthError(result.error || 'Sign in failed');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', DEMO_USER.username);
    setValue('password', DEMO_USER.password);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to your Mentoria account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {authError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Username or Email
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="zaleha or zaleha@witventure.com"
                className={`transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : watchedValues.email && !errors.email 
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : ''
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`pr-10 transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : watchedValues.password && !errors.password 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : ''
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-lg"
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
            
            {/* Demo credentials helper (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={fillDemoCredentials}
              >
                Fill demo credentials
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:text-primary/80 font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:text-primary/80 font-medium">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}