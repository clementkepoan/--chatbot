"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { cn } from "@/lib/utils"
import { ArrowUpIcon, MessageSquareTextIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import { useLanguage, type Locale } from "@/lib/i18n"
import { getSessionId } from "@/lib/session"
import { streamTextByChar } from "@/lib/stream-text"
import type { ChatMessage, ChatRequest, ChatResponse } from "@/lib/types"

interface StreamingMessage extends ChatMessage {
  isStreaming?: boolean
  isLoadingDots?: boolean
}

export function ChatForm({ className, ...props }: React.ComponentProps<"form">) {
  const { language, isEnglish } = useLanguage() // Only one useLanguage call
  const [messages, setMessages] = useState<StreamingMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    setSessionId(getSessionId())
  }, [])

  const sendMessage = async (content: string, currentLanguage: Locale) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = { role: "user", content }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const loadingDotsMessage: StreamingMessage = {
      role: "assistant",
      content: "",
      isLoadingDots: true,
    }

    let assistantMessageIndex = -1
    setMessages((prev) => {
      assistantMessageIndex = prev.length
      return [...prev, loadingDotsMessage]
    })

    try {
      const payloadLanguage = currentLanguage === "en" ? "en" : "zh"

      const payload: ChatRequest = {
        Language: payloadLanguage,
        Query: content,
        Session_ID: sessionId,
      }

      console.log("Sending payload:", JSON.stringify(payload, null, 2))
      console.log("Current language passed:", currentLanguage)
      console.log("Payload language:", payloadLanguage)

      const response = await fetch("https://luckily-renewing-oarfish.ngrok-free.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("API Error Response Body:", errorBody)
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      setMessages((prev) => {
        const newMessages = [...prev]
        if (newMessages[assistantMessageIndex]) {
          newMessages[assistantMessageIndex] = {
            ...newMessages[assistantMessageIndex],
            content: "",
            isLoadingDots: false,
            isStreaming: true,
          }
        }
        return newMessages
      })

      for await (const partialText of streamTextByChar(data.response, 15)) {
        setMessages((prev) => {
          const newMessages = [...prev]
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              content: partialText,
              isStreaming: true,
              isLoadingDots: false,
            }
          }
          return newMessages
        })
      }

      setMessages((prev) => {
        const newMessages = [...prev]
        if (newMessages[assistantMessageIndex]) {
          newMessages[assistantMessageIndex].isStreaming = false
        }
        return newMessages
      })
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => {
        const newMessages = [...prev]
        if (newMessages[assistantMessageIndex]) {
          newMessages[assistantMessageIndex] = {
            role: "assistant",
            content:
              currentLanguage === "en" ? "Sorry, an error occurred. Please try again." : "抱歉，發生錯誤，請再試一次。",
            isLoadingDots: false,
            isStreaming: false,
          }
        } else {
          newMessages.push({
            role: "assistant",
            content:
              currentLanguage === "en" ? "Sorry, an error occurred. Please try again." : "抱歉，發生錯誤，請再試一次。",
          })
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(input, language) // Use the language from the hook directly
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input, language) // Use the language from the hook directly
    }
  }

  const formatMessage = (content: string) => {
    let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    formatted = formatted.replace(/\n/g, "<br />")
    return formatted
  }

  const header = (
    <div className="m-auto flex max-w-md flex-col items-center gap-5 text-center">
      <MessageSquareTextIcon size={48} className="text-brand-red" />
      <h1 className="text-2xl font-semibold leading-none tracking-tight text-brand-black">
        {isEnglish ? "Menya Kokoro AI Assistant" : "麵屋心 AI 助理"}
      </h1>
      <p className="text-brand-black/80 text-sm">
        {isEnglish
          ? "Welcome! Ask me about our menu, store hours, or anything else about Menya Kokoro."
          : "歡迎！詢問我們的菜單、營業時間或任何關於麵屋心的問題。"}
      </p>
      <p className="text-brand-black/60 text-xs">
        {isEnglish ? "Powered by Next.js and AI." : "由 Next.js 和 AI 提供支援。"}
      </p>
    </div>
  )

  const messageList = (
    <div className="my-4 flex flex-col gap-3 px-2">
      {messages.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className={cn(
            "max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-sm",
            message.role === "user"
              ? "self-end bg-brand-red text-white rounded-br-none"
              : "self-start bg-brand-cream text-brand-black rounded-bl-none border border-brand-red/20",
          )}
        >
          {message.role === "assistant" ? (
            message.isLoadingDots ? (
              <div className="flex items-center space-x-1 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-red [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-red [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-red"></div>
              </div>
            ) : (
              <span className="leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                {message.isStreaming && (
                  <span className="inline-block w-[2px] h-[1em] ml-[2px] align-text-bottom bg-brand-black/70 animate-pulse" />
                )}
              </span>
            )
          ) : (
            message.content
          )}
        </div>
      ))}
    </div>
  )

  return (
    <TooltipProvider>
      <main
        className={cn(
          "mx-auto flex h-[calc(100svh-5rem)] max-h-[calc(100svh-5rem)] w-full max-w-[40rem] flex-col items-stretch border-none",
          className,
        )}
        {...props}
      >
        <div className="flex-1 content-center overflow-y-auto px-4 pt-4 pb-2 scroll-smooth">
          {messages.length ? messageList : header}
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-input bg-brand-cream focus-within:ring-brand-red/30 relative mx-4 mb-4 flex items-center rounded-2xl border border-brand-red/30 shadow-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0 min-h-[52px]"
        >
          <AutoResizeTextarea
            onKeyDown={handleKeyDown}
            onChange={(v) => setInput(v)}
            value={input}
            placeholder={isEnglish ? "Ask about our ramen..." : "詢問我們的拉麵..."}
            className="placeholder:text-brand-black/50 flex-1 bg-transparent text-brand-black focus:outline-none py-1 px-3.5 pr-12 text-base leading-relaxed"
            rows={1}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-lg bg-brand-red text-white hover:bg-brand-red/90 hover:text-white disabled:bg-gray-300 disabled:opacity-50"
                disabled={isLoading || !input.trim()}
              >
                <ArrowUpIcon size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={12} className="bg-brand-black text-brand-beige">
              {isEnglish ? "Send" : "發送"}
            </TooltipContent>
          </Tooltip>
        </form>
      </main>
    </TooltipProvider>
  )
}
