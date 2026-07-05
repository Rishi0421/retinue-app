// src/app/api/sync-shopify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { calculateTier } from '@/lib/tierCalculator' // Assuming you have this helper

export async function POST(req: NextRequest) {
  try {
    const { shopDomain, accessToken, brandId } = await req.json()

    if (!shopDomain || !accessToken || !brandId) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // 1. Fetch Customers from Shopify
    const customerRes = await fetch(`https://${shopDomain}/admin/api/2024-01/customers.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    })
    const customersData = await customerRes.json()
    const customers = customersData.customers || []

    let syncedCount = 0

    // 2. Process Each Customer
    for (const customer of customers) {
      const email = customer.email
      if (!email) continue

      // Check if buyer already exists
      const { data: existingBuyer } = await supabase
        .from('buyers')
        .select('id, total_drops_purchased')
        .eq('primary_email', email)
        .eq('brand_id', brandId)
        .single()

      if (existingBuyer) {
        // Update existing buyer's drop count based on order history if needed
        // For now, we assume webhook handles new orders, this is just for initial presence
        continue 
      }

      // Calculate Tier based on historical orders (Simplified logic for sync)
      // In real sync, you'd fetch their orders too. Here we default to Bronze or check order_count
      const totalOrders = customer.orders_count || 0
      const tier = calculateTier(totalOrders) 

      // Insert New Buyer
      await supabase.from('buyers').insert({
        brand_id: brandId,
        full_name: `${customer.first_name} ${customer.last_name}`.trim(),
        primary_email: email,
        phone_number: customer.phone || null,
        current_tier: tier,
        total_drops_purchased: totalOrders,
        last_order_date: customer.last_order_id ? new Date().toISOString() : null // Placeholder date
      })

      syncedCount++
    }

    return NextResponse.json({ success: true, synced: syncedCount })

  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}