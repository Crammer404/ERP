'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { authService } from '@/services';
import { ForgotPasswordDialog } from './forgot-password-dialog';
import { Loader } from '@/components/ui/loader';

export const LoginForm = () => {
  const { login, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/dashboard/');
    }
  }, [user, authLoading, router]);

  // Show loader while auth is being checked or user is authenticated
  if (authLoading || user) {
    return (
      <Loader 
        overlay 
        size="lg"
      />
    );
  }

  const getReadableError = (err: any) => {
    if (err?.response?.status === 401) return 'Invalid email or password. Please try again.';
    if (err?.response?.status === 500) return 'Server error. Please try again later.';
    return err?.response?.data?.message || 'Invalid email or password. Please try again.';
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ✅ stops refresh
    setLoading(true);
    setError('');

    try {
      const data = await authService.login({ email, password });

      if (data?.token) {
        login(data.user);
        // Token is already stored by authService.login() - no need to store again
        router.push('/dashboard');
      } else {
        setError('Login failed. No token returned.');
      }
    } catch (err: any) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader className="text-center p-8 pb-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-2">
        <form onSubmit={handleLogin} noValidate className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                required
                className="pl-10 h-12 border-2 focus:border-primary/50 transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                className="pl-10 pr-10 h-12 border-2 focus:border-primary/50 transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>}

          {/* Forgot password */}
          <div className="flex items-center justify-between">
            <ForgotPasswordDialog>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot Password?
              </button>
            </ForgotPasswordDialog>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full !mt-8" size="lg" disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2">Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
};