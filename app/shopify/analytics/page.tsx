// src/app/shopify/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, TrendingUp, Users, Trophy, DollarSign, Loader2 } from 'lucide-react'

const AVG_DROP_PRICE = 2500; // Default AOV in INR

interface Buyer {
  id: string;
  full_name: string | null;
  primary_email: string;
  current_tier: string;
  total_drops_purchased: number;
}

export default function AnalyticsPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR')
  const [rates, setRates] = useState<{ USD: number; EUR: number }>({ USD: 0.012, EUR: 0.011 })

  // ✅ Fetch Exchange Rates Once
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR')
        const data = await res.json()
        if (data?.rates) setRates({ USD: data.rates.USD, EUR: data.rates.EUR })
      } catch (err) { console.error('Rate fetch failed', err) }
    }
    fetchRates()
  }, [])

  // ✅ Dynamic Brand Detection & Data Fetch
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const shopDomain = params.get('shop') || 'retinue-test-store.myshopify.com'
      
      let { data: brand } = await supabase
        .from('brands')
        .select('*')
        .eq('shopify_domain', shopDomain)
        .single()

      // Auto-create if missing (Same as Dashboard)
      if (!brand) {
        const autoName = shopDomain.split('.')[0].replace(/-/g, ' ')
        const { data: newBrand } = await supabase
          .from('brands')
          .insert({ name: autoName, shopify_domain: shopDomain, currency: 'INR', gold_threshold: 5, silver_threshold: 3 })
          .select().single()
        brand = newBrand
      }

      if (brand?.currency) setCurrency(brand.currency as any)

      const { data } = await supabase
        .from('buyers')
        .select('*')
        .eq('brand_id', brand.id)
      
      if (data) setBuyers(data as Buyer[])
      setLoading(false)
    }
    init()
  }, [])

  // ✅ Dynamic Calculations
  const totalRevenue = buyers.reduce((acc, b) => acc + (b.total_drops_purchased * AVG_DROP_PRICE), 0)
  const vipRevenue = buyers
    .filter(b => ['Gold', 'Silver'].includes(b.current_tier))
    .reduce((acc, b) => acc + (b.total_drops_purchased * AVG_DROP_PRICE), 0)
  
  const tierDistribution = {
    Gold: buyers.filter(b => b.current_tier === 'Gold').length,
    Silver: buyers.filter(b => b.current_tier === 'Silver').length,
    Bronze: buyers.filter(b => b.current_tier === 'Bronze').length,
  }

  const topSpenders = [...buyers]
    .sort((a, b) => b.total_drops_purchased - a.total_drops_purchased)
    .slice(0, 5)

  // ✅ Currency Formatter
  const formatMoney = (amountInINR: number) => {
    let convertedAmount = amountInINR
    let currencyCode = 'INR'
    let locale = 'en-IN'

    if (currency === 'USD') {
      convertedAmount = amountInINR * rates.USD
      currencyCode = 'USD'
      locale = 'en-US'
    } else if (currency === 'EUR') {
      convertedAmount = amountInINR * rates.EUR
      currencyCode = 'EUR'
      locale = 'de-DE'
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(convertedAmount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-full">
      {/* Header with Back Button */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/shopify" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Business Analytics</h1>
            <p className="text-sm text-slate-500">Performance insights & ROI tracking</p>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Revenue Overview Cards - NOW DYNAMIC CURRENCY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-600">Total Estimated Revenue</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatMoney(totalRevenue)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-slate-600">VIP Contribution</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{formatMoney(vipRevenue)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {totalRevenue > 0 ? Math.round((vipRevenue / totalRevenue) * 100) : 0}% of total revenue
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-600">Avg. Drops per Buyer</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {buyers.length > 0 
                ? (buyers.reduce((acc, b) => acc + b.total_drops_purchased, 0) / buyers.length).toFixed(1) 
                : '0'}
            </p>
          </div>
        </div>

        {/* Tier Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-bold text-lg text-slate-900 mb-4">Customer Tier Distribution</h2>
          <div className="space-y-4">
            {Object.entries(tierDistribution).map(([tier, count]) => {
              const percentage = buyers.length > 0 ? (count / buyers.length) * 100 : 0;
              const color = tier === 'Gold' ? 'bg-amber-500' : tier === 'Silver' ? 'bg-slate-400' : 'bg-indigo-500';
              
              return (
                <div key={tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{tier}</span>
                    <span className="text-slate-500">{count} customers ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${color} transition-all duration-500`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Performers Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top 5 High-Value Customers
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Rank</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium">Total Drops</th>
                <th className="px-6 py-3 font-medium">Est. Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topSpenders.map((buyer, index) => (
                <tr key={buyer.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{buyer.full_name || buyer.primary_email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      buyer.current_tier === 'Gold' ? 'bg-amber-100 text-amber-800' :
                      buyer.current_tier === 'Silver' ? 'bg-slate-200 text-slate-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {buyer.current_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{buyer.total_drops_purchased}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">
                    {formatMoney(buyer.total_drops_purchased * AVG_DROP_PRICE)}
                  </td>
                </tr>
              ))}
              {topSpenders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No customer data available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}