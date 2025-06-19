"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquareTextIcon, UserIcon, LogInIcon } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

export default function HomePage() {
  const { isEnglish } = useLanguage()

  return (
    <main className="mx-auto flex h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] w-full max-w-[40rem] flex-col items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <MessageSquareTextIcon size={64} className="text-brand-red mx-auto" />
          <h1 className="text-4xl font-bold text-brand-black">{isEnglish ? "Menya Kokoro" : "麵屋心"}</h1>
          <p className="text-brand-black/80 text-lg">
            {isEnglish ? "Welcome to our authentic ramen experience" : "歡迎來到我們正宗的拉麵體驗"}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/chatbot">
            <Button className="w-full bg-brand-red hover:bg-brand-red/90 text-white py-6 text-lg">
              <MessageSquareTextIcon className="mr-2" size={20} />
              {isEnglish ? "Chat with AI Assistant" : "與 AI 助理聊天"}
            </Button>
          </Link>

          <div className="flex gap-4">
            <Link href="/auth/login" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-brand-red text-brand-red hover:bg-brand-red hover:text-white py-4"
              >
                <LogInIcon className="mr-2" size={16} />
                {isEnglish ? "Admin Login" : "管理員登入"}
              </Button>
            </Link>

            <Link href="/auth/register" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-brand-red text-brand-red hover:bg-brand-red hover:text-white py-4"
              >
                <UserIcon className="mr-2" size={16} />
                {isEnglish ? "Admin Register" : "管理員註冊"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
