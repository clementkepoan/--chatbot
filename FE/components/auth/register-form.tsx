"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon, LockIcon, MailIcon, KeyIcon } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/i18n"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { isEnglish } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate admin code first
    if (adminCode !== "123456") {
      setError(
        isEnglish
          ? "Invalid admin code. Please contact the administrator for the correct code."
          : "管理員代碼無效。請聯繫管理員獲取正確代碼。",
      )
      return
    }

    if (password !== confirmPassword) {
      setError(isEnglish ? "Passwords do not match" : "密碼不匹配")
      return
    }

    if (password.length < 6) {
      setError(isEnglish ? "Password must be at least 6 characters long" : "密碼必須至少6個字符")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        setSuccess(
          isEnglish
            ? "Registration successful! Please check your email to confirm your account."
            : "註冊成功！請檢查您的電子郵件以確認您的帳戶。",
        )
        // Auto-redirect after successful registration
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      }
    } catch (error) {
      setError(isEnglish ? "An unexpected error occurred. Please try again." : "發生意外錯誤。請重試。")
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-brand-red/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-red">
          <UserIcon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-brand-black">
          {isEnglish ? "Admin Registration" : "管理員註冊"}
        </CardTitle>
        <CardDescription className="text-brand-black/70">
          {isEnglish ? "Create your admin account for Menya Kokoro" : "為麵屋心創建您的管理員帳戶"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminCode" className="text-brand-black font-medium">
              {isEnglish ? "Admin Code" : "管理員代碼"} <span className="text-brand-red">*</span>
            </Label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/50" />
              <Input
                id="adminCode"
                type="password"
                placeholder={isEnglish ? "Enter admin code" : "輸入管理員代碼"}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="pl-10 border-brand-red/30 focus:border-brand-red"
                required
              />
            </div>
            <p className="text-xs text-brand-black/60">
              {isEnglish ? "Contact the administrator to obtain the admin code" : "聯繫管理員獲取管理員代碼"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-brand-black font-medium">
              {isEnglish ? "Email" : "電子郵件"}
            </Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/50" />
              <Input
                id="email"
                type="email"
                placeholder="admin@menyakokoro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-brand-red/30 focus:border-brand-red"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-brand-black font-medium">
              {isEnglish ? "Password" : "密碼"}
            </Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/50" />
              <Input
                id="password"
                type="password"
                placeholder={isEnglish ? "Enter your password (min 6 characters)" : "輸入您的密碼（至少6個字符）"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 border-brand-red/30 focus:border-brand-red"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-brand-black font-medium">
              {isEnglish ? "Confirm Password" : "確認密碼"}
            </Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/50" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder={isEnglish ? "Confirm your password" : "確認您的密碼"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 border-brand-red/30 focus:border-brand-red"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">{success}</div>}

          <Button
            type="submit"
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white py-2"
            disabled={isLoading}
          >
            {isLoading
              ? isEnglish
                ? "Creating Account..."
                : "創建帳戶中..."
              : isEnglish
                ? "Create Account"
                : "創建帳戶"}
          </Button>

          <div className="text-center text-sm text-brand-black/70">
            {isEnglish ? "Already have an account? " : "已經有帳戶？ "}
            <Link href="/auth/login" className="text-brand-red hover:underline font-medium">
              {isEnglish ? "Sign in" : "登入"}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
