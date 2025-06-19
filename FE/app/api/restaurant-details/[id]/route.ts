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
    const allowedFields = ["details", "description"]
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field name" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("restaurant_details")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating restaurant detail:", error)
      return NextResponse.json({ error: "Failed to update restaurant detail" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
