"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOutIcon, SaveIcon } from "lucide-react"
import { EditableTable } from "./editable-table"
import { useLanguage } from "@/lib/i18n"
import { supabase, type MenuItem, type RestaurantDetail } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [summaryData, setSummaryData] = useState<string>("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const router = useRouter()
  const { isEnglish } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  // Track changes when data is modified
  useEffect(() => {
    if (initialDataLoaded) {
      setHasChanges(true)
    }
  }, [menuItems, restaurantDetails, initialDataLoaded])

  // Add this useEffect after the existing useEffects (around line 35)
  useEffect(() => {
    if (initialDataLoaded) {
      loadSummaryData()
    }
  }, [isEnglish, initialDataLoaded])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setIsAuthenticated(true)
        setUserEmail(session.user.email || "")
        await loadData()
      } else {
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      // Load menu items
      const menuResponse = await fetch("/api/menu-items")
      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        setMenuItems(menuData)
      }

      // Load restaurant details
      const detailsResponse = await fetch("/api/restaurant-details")
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        setRestaurantDetails(detailsData)
      }

      setInitialDataLoaded(true)
      setHasChanges(false)
      await loadSummaryData()
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const loadSummaryData = async () => {
    setSummaryLoading(true)
    try {
      // Determine the language parameter based on current language
      const languageParam = isEnglish ? "english" : "traditionalchinese"

      const response = await fetch(`https://luckily-renewing-oarfish.ngrok-free.app/summary/${languageParam}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Parse the summary field specifically
        setSummaryData(data.summary || "")
      } else {
        console.log("Summary API not available, using default text")
        setSummaryData("")
      }
    } catch (error) {
      console.error("Error loading summary:", error)
      setSummaryData("")
    } finally {
      setSummaryLoading(false)
    }
  }

  // Function to parse markdown-style bold text
  const parseMarkdownText = (text: string) => {
    // Split text by **bold** patterns while preserving the delimiters
    const parts = text.split(/(\*\*.*?\*\*)/g)

    return parts.map((part, index) => {
      // Check if this part is wrapped in **
      if (part.startsWith("**") && part.endsWith("**")) {
        // Remove the ** and make it bold
        const boldText = part.slice(2, -2)
        return (
          <strong key={index} className="font-semibold text-brand-black">
            {boldText}
          </strong>
        )
      }
      // Regular text
      return part
    })
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSaveChanges = async () => {
    if (!hasChanges || isSaving) return

    setIsSaving(true)

    try {
      const response = await fetch("https://luckily-renewing-oarfish.ngrok-free.app/updatedb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        setHasChanges(false)
        toast({
          title: isEnglish ? "Success" : "成功",
          description: data.message || (isEnglish ? "Database synced successfully!" : "資料庫同步成功！"),
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Unknown error occurred")
      }
    } catch (error) {
      console.error("Save changes error:", error)
      toast({
        title: isEnglish ? "Error" : "錯誤",
        description:
          error instanceof Error
            ? error.message
            : isEnglish
              ? "Failed to sync database. Please try again."
              : "資料庫同步失敗，請重試。",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Menu Items handlers
  const addMenuItem = async (item: Omit<MenuItem, "id" | "created_at" | "updated_at">) => {
    const response = await fetch("/api/menu-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })

    if (response.ok) {
      const newItem = await response.json()
      setMenuItems((prev) => [newItem, ...prev])
    } else {
      throw new Error("Failed to add menu item")
    }
  }

  const updateMenuItem = async (id: string, field: string, value: string) => {
    const response = await fetch(`/api/menu-items/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field, value }),
    })

    if (response.ok) {
      const updatedItem = await response.json()
      setMenuItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
    } else {
      throw new Error("Failed to update menu item")
    }
  }

  const deleteMenuItem = async (id: string) => {
    const response = await fetch(`/api/menu-items?id=${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      throw new Error("Failed to delete menu item")
    }
  }

  // Restaurant Details handlers
  const addRestaurantDetail = async (detail: Omit<RestaurantDetail, "id" | "created_at" | "updated_at">) => {
    const response = await fetch("/api/restaurant-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(detail),
    })

    if (response.ok) {
      const newDetail = await response.json()
      setRestaurantDetails((prev) => [newDetail, ...prev])
    } else {
      throw new Error("Failed to add restaurant detail")
    }
  }

  const updateRestaurantDetail = async (id: string, field: string, value: string) => {
    const response = await fetch(`/api/restaurant-details/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field, value }),
    })

    if (response.ok) {
      const updatedDetail = await response.json()
      setRestaurantDetails((prev) => prev.map((detail) => (detail.id === id ? updatedDetail : detail)))
    } else {
      throw new Error("Failed to update restaurant detail")
    }
  }

  const deleteRestaurantDetail = async (id: string) => {
    const response = await fetch(`/api/restaurant-details?id=${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      setRestaurantDetails((prev) => prev.filter((detail) => detail.id !== id))
    } else {
      throw new Error("Failed to delete restaurant detail")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100svh-5rem)] bg-brand-beige flex items-center justify-center">
        <div className="text-brand-black">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  const menuColumns = [
    {
      key: "name",
      label: isEnglish ? "Item Name" : "項目名稱",
      type: "text" as const,
      placeholder: isEnglish ? "Limited Item - Coffee Milk Liquor" : "限定商品 - 咖啡牛奶酒",
    },
    {
      key: "price",
      label: isEnglish ? "Price" : "價格",
      type: "text" as const,
      placeholder: "NT.100",
    },
    {
      key: "description",
      label: isEnglish ? "Description" : "描述",
      type: "textarea" as const,
      placeholder: isEnglish ? "Coffee-flavored milk liquor" : "咖啡風味牛奶酒",
    },
  ]

  const restaurantColumns = [
    {
      key: "details",
      label: isEnglish ? "Details" : "詳情",
      type: "text" as const,
      placeholder: isEnglish ? "Opening Hours" : "營業時間",
    },
    {
      key: "description",
      label: isEnglish ? "Description" : "描述",
      type: "textarea" as const,
      placeholder: isEnglish ? "10:30 - 14:00 , 17:00-20:00" : "10:30 - 14:00 , 17:00-20:00",
    },
  ]

  return (
    <div className="min-h-[calc(100svh-5rem)] bg-brand-beige">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">{isEnglish ? "Admin Dashboard" : "管理員儀表板"}</h1>
            <p className="text-brand-black/70">{isEnglish ? `Welcome back, ${userEmail}` : `歡迎回來，${userEmail}`}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isSaving}
              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              {isSaving ? (isEnglish ? "Saving..." : "儲存中...") : isEnglish ? "Save Changes" : "儲存變更"}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              {isEnglish ? "Logout" : "登出"}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Summary Section */}
          <Card className="border-brand-red/20">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-brand-black">
                {isEnglish ? "Summary" : "摘要"}
              </CardTitle>
              <CardDescription>{isEnglish ? "Overview of your restaurant data" : "餐廳資料概覽"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-brand-cream rounded-lg">
                    <div className="text-3xl font-bold text-brand-red">{menuItems.length}</div>
                    <div className="text-brand-black/70">{isEnglish ? "Menu Items" : "菜單項目"}</div>
                  </div>
                  <div className="text-center p-4 bg-brand-cream rounded-lg">
                    <div className="text-3xl font-bold text-brand-red">{restaurantDetails.length}</div>
                    <div className="text-brand-black/70">{isEnglish ? "Restaurant Details" : "餐廳詳情"}</div>
                  </div>
                </div>

                <div className="p-4 bg-brand-cream/50 rounded-lg">
                  {summaryLoading ? (
                    <div className="text-center text-brand-black/60">
                      {isEnglish ? "Loading summary..." : "載入摘要中..."}
                    </div>
                  ) : (
                    <div className="text-brand-black/80 leading-relaxed whitespace-pre-line">
                      {summaryData
                        ? parseMarkdownText(summaryData)
                        : `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Table */}
          <EditableTable
            title={isEnglish ? "Menu Items" : "菜單項目"}
            data={menuItems}
            columns={menuColumns}
            onAdd={addMenuItem}
            onUpdate={updateMenuItem}
            onDelete={deleteMenuItem}
            emptyMessage={
              isEnglish
                ? "No menu items yet. Click 'Add' to create your first item!"
                : "尚無菜單項目，點擊「新增」建立第一個項目！"
            }
          />

          {/* Restaurant Details Table */}
          <EditableTable
            title={isEnglish ? "Restaurant Details" : "餐廳詳情"}
            data={restaurantDetails}
            columns={restaurantColumns}
            onAdd={addRestaurantDetail}
            onUpdate={updateRestaurantDetail}
            onDelete={deleteRestaurantDetail}
            emptyMessage={
              isEnglish
                ? "No restaurant details yet. Click 'Add' to create your first detail!"
                : "尚無餐廳詳情，點擊「新增」建立第一個詳情！"
            }
          />
        </div>
      </div>
    </div>
  )
}
