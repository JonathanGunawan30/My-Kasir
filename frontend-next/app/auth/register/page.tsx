"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formError, setFormError] = useState<string>('');
    const [formSuccess, setFormSuccess] = useState<string>('');
    const { register } = useAuth()
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setFormError('');

        if (formData.password.length < 8) {
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


        if (formData.password !== formData.password_confirmation) {
            const errorMessage = "Passwords do not match.";
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
            await (register as any)(formData);

            toast({
                title: "Success",
                description: "Account created successfully. You can now log in.",
                duration: 5000,
                variant: "success"
            });

            setFormData({
                name: "",
                email: "",
                password: "",
                password_confirmation: "",
            });

            setFormSuccess("Account created successfully. You can now log in.");
            setFormError("");

        } catch (error: any) {
            const errorMessage = error.response?.data?.message ||
                (error.response?.data?.errors && Object.values(error.response.data.errors).flat().join(', ')) ||
                "Registration failed. Please check your network or try again.";

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            setFormError(errorMessage);
            setFormSuccess("");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
                        <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                    <p className="text-gray-600">Get started with My Kasir</p>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-xl font-semibold text-center">Sign up</CardTitle>
                        <CardDescription className="text-center">Create your account to access the admin panel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Full name
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>

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
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a password"
                                        className="h-11 pr-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700">
                                    Confirm password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="passwordConfirmation"
                                        name="password_confirmation"
                                        type={showPasswordConfirmation ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
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

                            {formError && (
                                <p className="text-sm text-red-600 text-center font-medium bg-red-50/50 p-2 rounded-md border border-red-200">
                                    {formError}
                                </p>
                            )}

                            {formSuccess && (
                                <p className="text-sm text-green-600 text-center font-medium bg-green-50/50 p-2 rounded-md border border-green-200">
                                    {formSuccess}
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
                                        Creating account...
                                    </>
                                ) : (
                                    "Create account"
                                )}
                            </Button>
                        </form>

                        <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                {"Already have an account? "}
                                <Link
                                    href="/auth/login"
                                    className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}