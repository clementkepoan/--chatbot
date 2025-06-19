import { supabaseAdmin } from "@/lib/supabase-admin"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { field, value } = await request.json()
    const { id } = params

    if (!id || !field || value === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Validate field name to prevent SQL injection
    const allowedFields = ["name", "price", "description"]
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field name" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating menu item:", error)
      return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
