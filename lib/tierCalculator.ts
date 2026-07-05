// src/lib/tierCalculator.ts
import { supabase } from './supabaseClient'
import { addToKlaviyoList } from './klaviyoClient' // Ensure this file exists

export function calculateTier(totalDrops: number): string {
  if (totalDrops >= 5) return 'Gold'
  if (totalDrops >= 3) return 'Silver'
  return 'Bronze'
}

export async function updateBuyerTier(buyerId: string, newDropCount: number, email: string) {
  const newTier = calculateTier(newDropCount)
  
  const { error } = await supabase
    .from('buyers')
    .update({
      total_drops_purchased: newDropCount,
      current_tier: newTier,
      updated_at: new Date().toISOString()
    })
    .eq('id', buyerId)

  if (error) {
    console.error('Error updating tier:', error)
    return false
  }

  // ✅ Trigger Klaviyo when user becomes Gold
  if (newTier === 'Gold' && email) {
    const listId = process.env.KLAVIYO_VIP_LIST_ID
    if (listId) {
      await addToKlaviyoList(email, listId)
      console.log(`📧 Added ${email} to Klaviyo VIP List`)
    }
  }

  return true
}