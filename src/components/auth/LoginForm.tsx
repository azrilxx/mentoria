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
import { Eye, EyeOff, Loader2, AlertCircle, Mail } from 'lucide-react';
import { signInUser, DEMO_USER, checkPendingInvite } from '@/lib/firebaseAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
        toast({
          title: "Login Failed",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', DEMO_USER.username);
    setValue('password', DEMO_USER.password);
  };

  const handleRequestInvite = async () => {
    const emailValue = watchedValues.email;
    if (!emailValue) {
      toast({
        title: "Invitation Request",
        description: "Please enter your email address to request an invite.",
        variant: "default",
      });
      return;
    }

    // In a real application, this would trigger a Cloud Function to send an invite
    // For now, we'll simulate a check for an existing invite or a successful request
    setIsLoading(true);
    try {
      const invite = await checkPendingInvite(emailValue);
      if (invite) {
        toast({
          title: "Invitation Status",
          description: `An invite for ${emailValue} is already ${invite.status}.`,
          variant: "default",
        });
      } else {
        // Simulate sending an invite (in a real app, this would be a server call)
        toast({
          title: "Invite Requested",
          description: `An invitation has been sent to ${emailValue}. Please check your email.`, 
          variant: "success",
        });
        // Optionally, create a pending invite record in Firestore here for demo purposes
        // await setDoc(doc(db, "pendingInvites", emailValue), { invitedBy: "self-request", timestamp: new Date(), status: "pending" });
      }
    } catch (error) {
      console.error("Error checking/requesting invite:", error);
      toast({
        title: "Invitation Error",
        description: "Failed to process invite request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto font-pt-sans">
      <Card className="border border-border shadow-xl bg-card rounded-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <Icons.logo className="h-12 w-12 text-primary animate-in fade-in zoom-in-90 duration-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground font-montserrat">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base mt-2 text-muted-foreground font-pt-sans">
              Sign in to your Mentoria account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {authError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-pt-sans">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Username or Email
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="zaleha or zaleha@witventure.com"
                className={cn(
                  "transition-all duration-200 bg-input text-foreground border-border",
                  errors.email && "border-destructive focus-visible:ring-destructive",
                  watchedValues.email && !errors.email && "border-primary focus-visible:ring-primary"
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1 font-pt-sans">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={cn(
                    "pr-10 transition-all duration-200 bg-input text-foreground border-border",
                    errors.password && "border-destructive focus-visible:ring-destructive",
                    watchedValues.password && !errors.password && "border-primary focus-visible:ring-primary"
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
                <p className="text-sm text-destructive flex items-center gap-1 font-pt-sans">
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
                  className="rounded border-border text-primary focus:ring-primary"
                  {...register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground font-pt-sans">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors font-pt-sans"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground font-montserrat"
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
            
            {/* Request Invite Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full text-sm border-secondary text-secondary hover:bg-secondary/10 font-montserrat"
              onClick={handleRequestInvite}
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              Request Invite
            </Button>

            {/* Demo credentials helper (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground font-pt-sans"
                onClick={fillDemoCredentials}
                disabled={isLoading}
              >
                Fill demo credentials
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-muted-foreground font-pt-sans">
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