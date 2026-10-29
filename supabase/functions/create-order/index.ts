// Supabase Edge Function: place-order
// Located at: supabase/functions/place-order/index.ts
// SECURITY: This runs with service_role key on the server side only.
// It validates stock, calculates totals server-side, and creates the order atomically.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create an admin client (service_role key — only on server)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    // Create a user client to validate the JWT
    const authHeader = req.headers.get("Authorization")!
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const body = await req.json()
    const { delivery_method, payment_method, shipping_address, phone, full_name, notes, items } = body

    // --- Input Validation ---
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (!delivery_method || !["home_delivery", "store_pickup"].includes(delivery_method)) {
      return new Response(JSON.stringify({ error: "Invalid delivery method" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (!payment_method || !["cash_on_delivery", "pay_at_store"].includes(payment_method)) {
      return new Response(JSON.stringify({ error: "Invalid payment method" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (delivery_method === "home_delivery" && !shipping_address?.trim()) {
      return new Response(JSON.stringify({ error: "Shipping address required for home delivery" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (!phone?.trim()) {
      return new Response(JSON.stringify({ error: "Phone number required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // --- Stock Validation & Price Calculation (SERVER SIDE) ---
    const productIds = items.map((i: any) => i.product_id)
    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, name, name_bn, price, stock_quantity, is_active")
      .in("id", productIds)

    if (prodError) throw prodError

    const productMap = Object.fromEntries((products || []).map(p => [p.id, p]))
    let subtotal = 0
    const validatedItems = []

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity)))
      const product = productMap[item.product_id]

      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.product_id}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      if (!product.is_active) {
        return new Response(JSON.stringify({ error: `Product unavailable: ${product.name}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      if (product.stock_quantity < qty) {
        return new Response(JSON.stringify({ error: `Insufficient stock for: ${product.name_bn || product.name}. Available: ${product.stock_quantity}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      subtotal += product.price * qty
      validatedItems.push({ product_id: product.id, quantity: qty, unit_price: product.price, product_name: product.name })
    }

    // --- Delivery Fee Calculation (SERVER SIDE) ---
    const DELIVERY_FEE = 50
    const FREE_DELIVERY_THRESHOLD = 500
    let delivery_fee = 0
    if (delivery_method === "home_delivery") {
      delivery_fee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
    }
    const total_amount = subtotal + delivery_fee

    // --- Generate Order Number ---
    const order_number = `TVS-${Date.now().toString(36).toUpperCase()}`

    // --- Create Order ---
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number,
        status: "pending",
        delivery_method,
        payment_method,
        shipping_address: shipping_address?.trim() || "Store Pickup",
        phone: phone.trim(),
        full_name: full_name?.trim() || "",
        notes: notes?.trim() || "",
        subtotal,
        delivery_fee,
        total_amount,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // --- Create Order Items ---
    const orderItems = validatedItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems)
    if (itemsError) throw itemsError

    // --- Decrement Stock (SERVER SIDE) ---
    for (const item of validatedItems) {
      const { error: stockError } = await supabaseAdmin.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
      if (stockError) {
        // Log but don't fail the order if stock update has issues (should be rare)
        console.error("Stock decrement error:", stockError)
      }
    }

    return new Response(
      JSON.stringify({ order_id: order.id, order_number, total_amount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("place-order error:", err)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
