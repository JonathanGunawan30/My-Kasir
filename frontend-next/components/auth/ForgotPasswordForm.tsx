'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChefHat, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [formMessage, setFormMessage] = useState<string>('');
    const [formError, setFormError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormMessage('');
        setFormError('');

        try {
            const response = await api.sendPasswordResetLink(email);
            toast({
                title: "Success",
                description: response.message || "Password reset link sent to your email. Please check your inbox.",
                variant: "success",
            });
            setFormMessage(response.message || "Password reset link sent to your email. Please check your inbox.");
        } catch (err: any) {
            console.error('Forgot password API error:', err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to send password reset link. Please try again.";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            setFormError(errorMessage);
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-600">Enter your email to receive a password reset link.</p>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-xl font-semibold text-center">Send Reset Link</CardTitle>
                        <CardDescription className="text-center">
                            We will send a link to reset your password to your email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
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
                                        Sending link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                        <div className="text-center pt-4 border-t border-gray-100">
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