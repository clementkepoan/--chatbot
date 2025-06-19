import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import Image from "next/image"
import { LanguageToggle } from "@/components/language-toggle"
import { LanguageProvider } from "@/lib/i18n"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Menya Kokoro AI Chatbot",
  description: "A themed chatbot for Menya Kokoro, built with the AI SDK.",
    generator: 'v0.dev'
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={cn("flex min-h-svh flex-col antialiased bg-brand-beige text-brand-black", inter.className)}>
        <LanguageProvider>
          <header className="fixed top-0 left-0 z-50 w-full bg-brand-beige/95 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
            <div className="mx-auto max-w-[40rem] flex items-center justify-between">
              <Link href="/">
                <Image src="/logo.png" alt="Menya Kokoro Logo" width={150} height={50} priority />
              </Link>
              <LanguageToggle />
            </div>
          </header>
          <TooltipProvider delayDuration={0}>
            <div className="flex-grow pt-20">{children}</div>
          </TooltipProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  )
}


import './globals.css'