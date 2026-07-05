// src/app/api/sync-shopify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { shopDomain, accessToken, brandId } = await req.json()

    if (!shopDomain || !accessToken || !brandId) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // ✅ Fetch Orders Instead of Customers (Catches Guest Checkouts Too)
    const orderRes = await fetch(
      `https://${shopDomain}/admin/api/2024-01/orders.json?limit=100&status=any&fields=id,email,created_at,customer,billing_address,line_items`, 
      {
        headers: { 'X-Shopify-Access-Token': accessToken }
      }
    )
    
    const ordersData = await orderRes.json()
    const orders = ordersData.orders || []

    console.log(`Found ${orders.length} orders to process`)

    let syncedCount = 0
    const processedEmails = new Set<string>()

    for (const order of orders) {
      // Get email from customer object OR billing address (for guests)
      const email = order.customer?.email || order.billing_address?.email
      
      // Skip if no email or already processed this email in this batch
      if (!email || processedEmails.has(email)) continue;
      processedEmails.add(email);

      // Check if buyer already exists in our DB
      const { data: existingBuyer } = await supabase
        .from('buyers')
        .select('id, total_drops_purchased')
        .eq('primary_email', email)
        .eq('brand_id', brandId)
        .single()

      if (existingBuyer) {
        // Optional: Update their drop count here if needed
        // For initial sync, we just skip duplicates
        continue 
      }

      // Calculate Tier based on order count (Simplified for sync)
      // In production, you'd fetch ALL orders for this email to get exact count
      const tier = 'Bronze'; // Default for first sync

      // Insert New Buyer into Supabase
      const { error } = await supabase.from('buyers').insert({
        brand_id: brandId,
        full_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || order.billing_address?.name || 'Customer'}`.trim(),
        primary_email: email,
        current_tier: tier,
        total_drops_purchased: 1, // Starting with 1 since we found an order
        last_order_date: order.created_at
      })

      if (!error) {
        syncedCount++;
        console.log(`Synced: ${email}`)
      } else {
        console.error(`Failed to sync ${email}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced: syncedCount,
      message: syncedCount > 0 ? `Successfully synced ${syncedCount} customers from orders.` : 'No new customers found in recent orders.'
    })

  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Sync failed: ' + (error as Error).message }, { status: 500 })
  }
}