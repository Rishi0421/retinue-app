// src/app/api/sync-shopify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { calculateTier } from '@/lib/tierCalculator' // Assuming you have this helper

export async function POST(req: NextRequest) {
  try {
    const { shopDomain, accessToken, brandId } = await req.json()

    // 1. Fetch Customers with Email (Filter added)
    // Hum specific fields maang rahe hain taaki response clean aaye
    const customerRes = await fetch(`https://${shopDomain}/admin/api/2024-01/customers.json?fields=id,email,first_name,last_name,orders_count&limit=50`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    })
    
    const customersData = await customerRes.json()
    
    // Debugging: Console mein dekho kya aa raha hai
    console.log('Shopify Response:', JSON.stringify(customersData)) 

    const customers = customersData.customers || []

    if (customers.length === 0) {
        return NextResponse.json({ success: true, synced: 0, message: 'No customers found in Shopify store.' })
    }

    let syncedCount = 0

    for (const customer of customers) {
      // Sirf valid emails wale customers lo
      if (!customer.email) continue;

      // Check duplicate
      const { data: existingBuyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('primary_email', customer.email)
        .eq('brand_id', brandId)
        .single()

      if (existingBuyer) continue; // Skip if already exists

      // Tier Calculation (Simple logic for sync)
      const orders = customer.orders_count || 0;
      let tier = 'Bronze';
      if (orders >= 5) tier = 'Gold';
      else if (orders >= 3) tier = 'Silver';

      // Insert into DB
      const { error } = await supabase.from('buyers').insert({
        brand_id: brandId,
        full_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
        primary_email: customer.email,
        current_tier: tier,
        total_drops_purchased: orders,
        last_order_date: new Date().toISOString() // Placeholder for sync
      })

      if (!error) syncedCount++;
    }

    return NextResponse.json({ success: true, synced: syncedCount })

  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}