"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    User,
    Mail,
    Calendar,
    Shield,
    Save,
    Loader2,
    Eye,
    EyeOff,
    Lock,
    Edit3,
    Check,
    X,
    Globe,
    Info,
    Upload,
    UserCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

import type { UserProfile } from "@/types"


interface PasswordChangeData {
    current_password: string
    new_password: string
    new_password_confirmation: string
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setSaving] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSettingGravatar, setSettingGravatar] = useState(false)

    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
    const [passwordData, setPasswordData] = useState<PasswordChangeData>({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await api.getProfile()
            // @ts-ignore
            setProfile(response.data)
            // @ts-ignore
            setEditedProfile(response.data)
        } catch (error) {
            console.error("Failed to fetch profile:", error)
            toast({
                title: "Error",
                description: "Failed to load profile information",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        try {
            setSaving(true)
            const dataToSave = {
                name: editedProfile.name,
                email: editedProfile.email,
            }

            const response = await api.updateProfile(dataToSave)

            // @ts-ignore
            setProfile((prevProfile) => {
                if (!prevProfile) {
                    return response.data
                }
                const newProfileData = {
                    ...prevProfile,
                    ...response.data,
                }

                if (!response.data.role && prevProfile.role) {
                    newProfileData.role = prevProfile.role
                }

                return newProfileData
            })

            setIsEditing(false)
            toast({
                title: "Success",
                description: "Profile updated successfully",
                variant: "success",
            })
        } catch (error: any) {
            console.error("Failed to update profile:", error)
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update profile",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (passwordData.new_password.length < 8) {
            toast({
                title: "Error",
                description: "New password must be at least 8 characters long",
                variant: "destructive",
            })
            return
        }

        try {
            setIsChangingPassword(true)
            await api.changePassword(passwordData)
            setPasswordData({
                current_password: "",
                new_password: "",
                new_password_confirmation: "",
            })
            toast({
                title: "Success",
                description: "Password changed successfully",
                variant: "success",
            })
        } catch (error: any) {
            console.error("Failed to change password:", error)
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to change password",
                variant: "destructive",
            })
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "File size must be less than 5MB",
                variant: "destructive",
            })
            return
        }

        try {
            const formData = new FormData()
            formData.append("avatar", file)

            const response = await api.uploadAvatar(formData)

            // @ts-ignore
            setProfile((prevProfile) => {
                if (!prevProfile) {
                    return response.data
                }
                const newProfileData = {
                    ...prevProfile,
                    ...response.data,
                };

                 if (!response.data.role && prevProfile.role) {
                    newProfileData.role = prevProfile.role;
                }

                return newProfileData;
            })

            toast({
                title: "Success",
                description: "Profile picture updated successfully",
                variant: "success",
            })
        } catch (error: any) {
            console.error("Failed to upload avatar:", error)
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to upload profile picture",
                variant: "destructive",
            })
        }
    }

    const handleSetGravatar = async () => {
        if (!profile?.email) {
            toast({
                title: "Error",
                description: "Email address is required to use Gravatar.",
                variant: "destructive",
            })
            return
        }

        try {
            setSettingGravatar(true)
            const response = await api.setGravatarAvatar()
            // @ts-ignore
            setProfile((prevProfile) => {
                if (!prevProfile) {
                    return response.data
                }
                const newProfileData = {
                    ...prevProfile,
                    ...response.data,
                };

                if (!response.data.role && prevProfile.role) {
                    newProfileData.role = prevProfile.role;
                }

                return newProfileData;
            })
            toast({
                title: "Success",
                description: "Avatar updated from Gravatar successfully!",
                variant: "success",
            })
        } catch (error: any) {
            console.error("Failed to set Gravatar avatar:", error)
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to set avatar from Gravatar",
                variant: "destructive",
            })
        } finally {
            setSettingGravatar(false)
        }
    }

    const getRoleColor = (role: any) => {
        const roleName = Array.isArray(role) && role.length > 0 ? role[0].name : "default"

        const normalizedRole = typeof roleName === "string" ? roleName.toLowerCase() : "default"

        switch (normalizedRole) {
            case "admin":
            case "admin assistant":
                return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0"
            case "manager":
                return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
            case "cashier":
                return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
            default:
                return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0"
        }
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name || typeof name !== "string") {
            return "??"
        }

        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
                    <p className="text-gray-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
                    <CardContent className="text-center py-12">
                        <UserCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Failed to load profile information</p>
                        <Button
                            onClick={fetchProfile}
                            className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        >
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const roleForDisplay = Array.isArray(profile.role) && profile.role.length > 0 ? profile.role[0].name : "N/A"

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
                {/* Improved Modern Header */}
                <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700">
                        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" fillRule="evenodd">
                                <g fill="#ffffff" fillOpacity="0.1">
                                    <circle cx="30" cy="30" r="2"/>
                                </g>
                            </g>
                        </svg>
                    </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm font-medium">
                            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                            Account Settings
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                            Profile Settings
                        </h1>

                        <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                            Manage your account information, security settings, and personal preferences
                        </p>

                        <div className="flex items-center justify-center gap-6 pt-4">
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                                <div className="h-1.5 w-1.5 bg-green-400 rounded-full"></div>
                                <span>Secure Connection</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full"></div>
                                <span>Auto-Save Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1200 120" fill="none" className="w-full h-12">
                        <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="rgb(249 250 251)" />
                    </svg>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Enhanced Profile Overview Card */}
                    <Card className="xl:col-span-1 border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
                        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 h-24 relative">
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                        <CardHeader className="text-center pb-6 -mt-12 relative">
                            <div className="relative inline-block">
                                <Avatar
                                    key={profile.avatar}
                                    className="w-24 h-24 mx-auto border-4 border-white shadow-2xl ring-4 ring-orange-100"
                                >
                                    <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xl font-bold">
                                        {getInitials(profile.name)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Enhanced Avatar Controls */}
                                <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <label
                                                htmlFor="avatar-upload"
                                                className="bg-white hover:bg-gray-50 text-orange-600 p-2.5 rounded-full cursor-pointer shadow-lg border-2 border-orange-100 transition-all duration-200 hover:scale-105"
                                            >
                                                <Upload className="h-4 w-4" />
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </TooltipTrigger>

                                        <TooltipContent
                                            side="bottom"
                                            align="end"
                                            sideOffset={8}
                                            className="bg-gray-900 text-white p-3 max-w-sm"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium">Upload New Photo</p>
                                                <p className="text-xs text-gray-300">Maximum file size: 2MB</p>
                                                <p className="text-xs text-gray-300">Supported: JPG, PNG, JPEG</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                size="icon"
                                                onClick={handleSetGravatar}
                                                disabled={isSettingGravatar || !profile.email}
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0 transition-all duration-200 hover:scale-105 p-2.5"
                                            >
                                                {isSettingGravatar ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Globe className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>

                                        <TooltipContent
                                            side="bottom"
                                            align="end"
                                            sideOffset={12}
                                            className="bg-gray-900 text-white p-3 max-w-xs"
                                        >
                                            <div className="space-y-2">
                                                <p className="font-medium flex items-center gap-2">
                                                    <Globe className="h-3 w-3" />
                                                    Use Gravatar Avatar
                                                </p>
                                                <p className="text-xs text-gray-300 leading-relaxed">
                                                    Sync your profile picture from Gravatar.com using your email address
                                                </p>
                                                {!profile.email && (
                                                    <p className="text-xs text-red-300 font-medium">⚠️ Email address required</p>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>


                                <div className="mt-6 space-y-3">
                                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                                    <p className="text-gray-600 text-sm break-all">{profile.email}</p>
                                    <Badge variant="outline" className={`${getRoleColor(profile.role)} shadow-lg`}>
                                        <Shield className="h-3 w-3 mr-1" />
                                        {roleForDisplay}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <Separator className="bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-orange-50 rounded-lg">
                                    <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-700">Member since</p>
                                        <p className="text-xs">
                                            {new Date(profile.created_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-700">Account Status</p>
                                        <p className="text-xs text-green-600 font-medium">Active & Verified</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enhanced Profile Information Card */}
                    <Card className="xl:col-span-3 border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    Personal Information
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    Update your personal details and contact information
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (isEditing) {
                                        setEditedProfile(profile)
                                    }
                                    setIsEditing(!isEditing)
                                }}
                                className={`border-2 transition-all duration-200 ${
                                    isEditing
                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                        : "border-orange-200 text-orange-600 hover:bg-orange-50"
                                }`}
                            >
                                {isEditing ? (
                                    <>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </>
                                )}
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="h-4 w-4 text-orange-500" />
                                        Full Name
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="name"
                                            value={isEditing ? editedProfile.name || "" : profile.name || ""}
                                            onChange={(e) => setEditedProfile((prev) => ({ ...prev, name: e.target.value }))}
                                            disabled={!isEditing}
                                            className={`pl-4 pr-4 h-12 border-2 transition-all duration-200 ${
                                                isEditing
                                                    ? "border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                            }`}
                                            placeholder="Enter your full name"
                                        />
                                        {isEditing && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <Edit3 className="h-4 w-4 text-orange-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-orange-500" />
                                        Email Address
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={isEditing ? editedProfile.email || "" : profile.email || ""}
                                            onChange={(e) => setEditedProfile((prev) => ({ ...prev, email: e.target.value }))}
                                            disabled={!isEditing}
                                            className={`pl-4 pr-4 h-12 border-2 transition-all duration-200 ${
                                                isEditing
                                                    ? "border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                            }`}
                                            placeholder="Enter your email address"
                                        />
                                        {isEditing && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <Edit3 className="h-4 w-4 text-orange-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 lg:col-span-2">
                                    <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-orange-500" />
                                        Role & Permissions
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="role"
                                            value={roleForDisplay}
                                            disabled
                                            className="pl-4 pr-4 h-12 border-2 border-gray-200 bg-gray-50 text-gray-600"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <Lock className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        Role is managed by system administrators
                                    </p>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg border-0 h-12 px-8 transition-all duration-200 hover:scale-105"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditedProfile(profile)
                                            setIsEditing(false)
                                        }}
                                        className="border-2 border-gray-200 text-gray-600 hover:bg-gray-50 h-12 px-8"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Enhanced Password Change Card */}
                    <Card className="xl:col-span-4 border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="pb-6">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                                    <Lock className="h-5 w-5 text-white" />
                                </div>
                                Security Settings
                            </CardTitle>
                            <CardDescription>Update your password to keep your account secure and protected</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="current_password" className="text-sm font-semibold text-gray-700">
                                        Current Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData((prev) => ({ ...prev, current_password: e.target.value }))}
                                            placeholder="Enter current password"
                                            className="pl-4 pr-12 h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-red-500"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="new_password" className="text-sm font-semibold text-gray-700">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password"
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))}
                                            placeholder="Enter new password"
                                            className="pl-4 pr-12 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="new_password_confirmation" className="text-sm font-semibold text-gray-700">
                                        Confirm New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password_confirmation"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordData.new_password_confirmation}
                                            onChange={(e) =>
                                                setPasswordData((prev) => ({ ...prev, new_password_confirmation: e.target.value }))
                                            }
                                            placeholder="Confirm new password"
                                            className="pl-4 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={
                                        isChangingPassword ||
                                        !passwordData.current_password ||
                                        !passwordData.new_password ||
                                        !passwordData.new_password_confirmation
                                    }
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg border-0 h-12 px-8 transition-all duration-200 hover:scale-105"
                                >
                                    {isChangingPassword ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating Password...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Update Password
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Enhanced Password Requirements */}
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 rounded-lg p-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Shield className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-orange-800 mb-3">Password Security Requirements</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2 text-sm text-orange-700">
                                                <Check className="h-3 w-3 text-green-600" />
                                                At least 8 characters long
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-orange-700">
                                                <Check className="h-3 w-3 text-green-600" />
                                                Include letters and numbers
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-orange-700">
                                                <Check className="h-3 w-3 text-green-600" />
                                                Use special characters
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-orange-700">
                                                <Check className="h-3 w-3 text-green-600" />
                                                Avoid common passwords
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div></div>
        </TooltipProvider>
    )
}
