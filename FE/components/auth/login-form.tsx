"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon, MailIcon, LogInIcon } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/i18n"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isEnglish } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        router.push("/admin")
      }
    } catch (error) {
      setError(isEnglish ? "An unexpected error occurred. Please try again." : "發生意外錯誤。請重試。")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-brand-red/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-red">
          <LogInIcon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-brand-black">
          {isEnglish ? "Admin Login" : "管理員登入"}
        </CardTitle>
        <CardDescription className="text-brand-black/70">
          {isEnglish ? "Sign in to manage Menya Kokoro" : "登入以管理麵屋心"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder={isEnglish ? "Enter your password" : "輸入您的密碼"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 border-brand-red/30 focus:border-brand-red"
                required
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white py-2"
            disabled={isLoading}
          >
            {isLoading ? (isEnglish ? "Signing in..." : "登入中...") : isEnglish ? "Sign In" : "登入"}
          </Button>

          <div className="text-center text-sm text-brand-black/70">
            {isEnglish ? "Don't have an account? " : "沒有帳戶？ "}
            <Link href="/auth/register" className="text-brand-red hover:underline font-medium">
              {isEnglish ? "Register here" : "在此註冊"}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
