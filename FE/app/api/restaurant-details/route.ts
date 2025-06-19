import { supabaseAdmin } from "@/lib/supabase-admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurant_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching restaurant details:", error)
      return NextResponse.json({ error: "Failed to fetch restaurant details" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { details, description } = await request.json()

    if (!details || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("restaurant_details")
      .insert([{ details, description }])
      .select()
      .single()

    if (error) {
      console.error("Error creating restaurant detail:", error)
      return NextResponse.json({ error: "Failed to create restaurant detail" }, { status: 500 })
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
      return NextResponse.json({ error: "Missing detail ID" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("restaurant_details").delete().eq("id", id)

    if (error) {
      console.error("Error deleting restaurant detail:", error)
      return NextResponse.json({ error: "Failed to delete restaurant detail" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
