import { supabaseAdmin } from "@/lib/supabase-admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("menu_items").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching menu items:", error)
      return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, price, description } = await request.json()

    if (!name || !price || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .insert([{ name, price, description }])
      .select()
      .single()

    if (error) {
      console.error("Error creating menu item:", error)
      return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting menu item:", error)
      return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
