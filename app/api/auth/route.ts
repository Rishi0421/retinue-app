// src/app/api/auth/route.ts
import { redirect } from 'next/navigation'
import '@shopify/shopify-api/adapters/web-api'
import { shopifyApi, ApiVersion } from '@shopify/shopify-api'

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES!.split(','),
  hostName: process.env.HOST!.replace('https://', '').replace('http://', ''),
  apiVersion: ApiVersion.April25,
  isEmbeddedApp: false, // Abhi ke liye standalone rakhte hain testing ease ke liye
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const shop = url.searchParams.get('shop')

  if (!shop) {
    return new Response('Missing shop parameter', { status: 400 })
  }

  // Clean shop name (remove .myshopify.com if present)
  const cleanShop = shop.replace('.myshopify.com', '')
  
  const authRoute = await shopify.auth.begin({
    shop: `${cleanShop}.myshopify.com`,
    callbackPath: '/api/auth/callback',
    isOnline: false, // Offline access tokens are better for background webhooks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawRequest: request as any,
  })

  return authRoute

}