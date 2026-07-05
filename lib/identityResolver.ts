// src/lib/identityResolver.ts
import { supabase } from './supabaseClient'

export async function resolveBuyerIdentity(
  brandId: string,
  email: string,
  phone?: string,
  name?: string
) {
  console.log('🔍 Resolving identity for:', email, 'Brand:', brandId) // Debug log

  // 1. Check if buyer exists by email OR phone within this brand
  const { data: existingBuyer, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('brand_id', brandId)
    .or(`primary_email.eq.${email},phone_number.eq.${phone}`)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error(' Error finding buyer:', error.message, error.details) // Detailed error
    return null
  }

  // 2. If buyer exists, return it
  if (existingBuyer) {
    console.log('✅ Existing buyer found:', existingBuyer.id)
    return existingBuyer
  }

  // 3. If new buyer, create profile with Bronze tier
  const { data: newBuyer, error: createError } = await supabase
    .from('buyers')
    .insert({
      brand_id: brandId,
      primary_email: email,
      phone_number: phone || null,
      full_name: name || null,
      current_tier: 'Bronze',
      total_drops_purchased: 0
    })
    .select()
    .single()

  if (createError) {
    console.error('❌ Error creating buyer:', createError.message, createError.details) // Detailed error
    return null
  }

  console.log('🆕 New buyer created:', newBuyer.id)
  return newBuyer
}