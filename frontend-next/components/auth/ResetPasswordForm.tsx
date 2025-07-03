'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [formMessage, setFormMessage] = useState<string>('');
    const [formError, setFormError] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const tokenParam = searchParams.get('token');

        if (emailParam) setEmail(emailParam);
        if (tokenParam) setToken(tokenParam);
        else {
            toast({
                title: "Error",
                description: "Invalid or missing password reset token. Please request a new link.",
                variant: "destructive",
            });
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormMessage('');
        setFormError('');

        if (!email || !token) {
            const errorMessage = "Email or reset token is missing. Please ensure you clicked the link from your email.";
            setFormError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            const errorMessage = 'Password must be at least 8 characters long.';
            setFormError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        if (password !== passwordConfirmation) {
            const errorMessage = 'Password confirmation does not match.';
            setFormError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        try {
            const data = await api.resetPassword({
                email,
                password,
                password_confirmation: passwordConfirmation,
                token,
            });

            const successMessage = data.message || 'Password successfully reset! You will be redirected to the login page.';
            setFormMessage(successMessage);
            toast({
                title: "Success",
                description: successMessage,
                variant: "success",
            });

            setPassword('');
            setPasswordConfirmation('');
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);

        } catch (err: any) {
            console.error("Reset password API error:", err);
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred while resetting the password. Please try again.';
            setFormError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
                        <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
                    <p className="text-gray-600">Set a new password for your account.</p>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-xl font-semibold text-center">Set New Password</CardTitle>
                        <CardDescription className="text-center">Enter your new password below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    className="h-11 border-gray-200 bg-gray-100 cursor-not-allowed"
                                    readOnly
                                />
                                {!email || !token ? (
                                    <p className="text-xs text-red-500 mt-1">
                                        Email or token missing. Please use the full link from your reset email.
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        placeholder="Enter your new password"
                                        className="h-11 pr-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={showPasswordConfirmation ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={passwordConfirmation}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordConfirmation(e.target.value)}
                                        placeholder="Confirm your new password"
                                        className="h-11 pr-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                    >
                                        {showPasswordConfirmation ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {formMessage && (
                                <p className="text-sm text-green-600 text-center font-medium bg-green-50/50 p-2 rounded-md border border-green-200">
                                    {formMessage}
                                </p>
                            )}
                            {formError && (
                                <p className="text-sm text-red-600 text-center font-medium bg-red-50/50 p-2 rounded-md border border-red-200">
                                    {formError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                        <div className="text-center pt-4 border-t border-gray-100 mt-6">
                            <p className="text-sm text-gray-600">
                                <Link
                                    href="/auth/login"
                                    className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                                >
                                    Back to login
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}