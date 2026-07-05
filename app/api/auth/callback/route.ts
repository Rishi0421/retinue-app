// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import '@shopify/shopify-api/adapters/web-api'
import { shopifyApi, ApiVersion } from '@shopify/shopify-api'

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES!.split(','),
  hostName: process.env.HOST!.replace('https://', '').replace('http://', ''),
  apiVersion: ApiVersion.April25,
  isEmbeddedApp: false,
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth callback received')
    
    // Convert NextRequest to a plain Request object that Shopify API expects
    const plainRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
    })

    const callback = await shopify.auth.callback({
      rawRequest: plainRequest as any,
    })

    const session = callback.session
    console.log('✅ Session established for:', session.shop)
    
    // ✅ Webhooks Register Karna
    const client = new shopify.clients.Graphql({ session })
    
    try {
      await client.request(`mutation {
          webhookSubscriptionCreate(
            topic: ORDERS_CREATE
            webhookSubscription: {
              callbackUrl: "${process.env.HOST}/api/webhooks/shopify"
              format: JSON
            }
          ) {
            userErrors { field message }
            webhookSubscription { id }
          }
        }`)
      console.log('✅ Webhooks registered successfully')
    } catch (webhookError) {
      console.warn('⚠️ Webhook registration failed (might already exist):', webhookError)
    }

    // Dashboard par redirect with session info
    // Fix: Force http for localhost, https for ngrok
    const protocol = request.nextUrl.hostname.includes('localhost') ? 'http:' : 'https:'
    const dashboardUrl = new URL(`${protocol}//${request.nextUrl.host}/`)
    
    dashboardUrl.searchParams.set('shop', session.shop)
    dashboardUrl.searchParams.set('accessToken', session.accessToken || '')
    
    const response = NextResponse.redirect(dashboardUrl)
    
    if (callback.headers) {
      for (const [key, value] of callback.headers.entries()) {
        response.headers.append(key, value)
      }
    }
    
    return response

  } catch (error: any) {
    console.error('❌ Auth callback error details:')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    // Return detailed error for debugging
    return NextResponse.json({ 
      error: 'Authentication failed', 
      details: error.message 
    }, { status: 500 })
  }
}