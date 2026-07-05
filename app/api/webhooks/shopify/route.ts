// src/app/api/webhooks/shopify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resolveBuyerIdentity } from '@/lib/identityResolver'
import { updateBuyerTier,calculateTier } from '@/lib/tierCalculator'
import { supabase } from '@/lib/supabaseClient'


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Shopify Order Data Extract Karna
    const order = body
    const brandId = process.env.DEFAULT_BRAND_ID! // Abhi ke liye hardcoded, baad mein dynamic karenge
    const email = order.email
    const phone = order.customer?.phone || null
    const name = `${order.customer?.first_name} ${order.customer?.last_name}`.trim()
    const orderId = order.id.toString()
    const dropName = order.name // e.g., "#1024"
    const totalAmount = order.total_price

    // 1. Buyer Identity Resolve Karna (Merge Logic)
    const buyer = await resolveBuyerIdentity(brandId, email, phone, name)
    if (!buyer) {
      return NextResponse.json({ error: 'Failed to resolve buyer' }, { status: 500 })
    }

    // 2. Order Save Karna
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_id: buyer.id,
      brand_id: brandId,
      shopify_order_id: orderId,
      order_email: email,
      drop_name: dropName,
      total_amount: totalAmount,
      purchased_at: order.created_at
    })

    if (orderError) {
      console.error('Order save error:', orderError)
      // Agar order duplicate hai toh ignore karo, warna error return karo
      if (orderError.code !== '23505') { 
        return NextResponse.json({ error: 'Order save failed' }, { status: 500 })
      }
    }

    // 3. Tier Update Karna
    const newDropCount = buyer.total_drops_purchased + 1
    await updateBuyerTier(buyer.id, newDropCount, email)

    return NextResponse.json({ success: true, buyerId: buyer.id, newTier: calculateTier(newDropCount) })

  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}