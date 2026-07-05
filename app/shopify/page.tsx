// src/app/shopify/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { 
  Users, Trophy, DollarSign, TrendingUp, 
  ArrowRight, Download, Settings, BarChart3, Loader2
} from 'lucide-react'

const AVG_DROP_PRICE = 2500; // Default AOV in INR

interface Buyer {
  id: string;
  full_name: string | null;
  primary_email: string;
  current_tier: string;
  total_drops_purchased: number;
  created_at: string;
  last_order_date?: string | null;
}

export default function ShopifyAppPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR')
  const [rates, setRates] = useState<{ USD: number; EUR: number }>({ USD: 0.012, EUR: 0.011 })
  const [brand, setBrand] = useState<any>(null)

  // ✅ Fetch Exchange Rates Only Once
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR')
        const data = await res.json()
        if (data?.rates) {
          setRates({ USD: data.rates.USD, EUR: data.rates.EUR })
        }
      } catch (err) {
        console.error('Exchange rate fetch failed:', err)
      }
    }
    fetchRates()
  }, [])

  // ✅ Initialize App & Auto-Onboard Brand
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const shopDomain = params.get('shop') || 'retinue-test-store.myshopify.com'
      
      // 1. Check if brand exists
      let { data: existingBrand } = await supabase
        .from('brands')
        .select('*')
        .eq('shopify_domain', shopDomain)
        .single()

      // 2. Auto-create brand if missing (Zero-touch onboarding)
      if (!existingBrand) {
        const autoName = shopDomain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        
        const { data: newBrand, error } = await supabase
          .from('brands')
          .insert({
            name: autoName,
            shopify_domain: shopDomain,
            currency: 'INR',
            gold_threshold: 5,
            silver_threshold: 3
          })
          .select()
          .single()

        if (newBrand && !error) {
          existingBrand = newBrand
        } else {
          console.error('Auto-onboarding failed:', error)
          setLoading(false)
          return
        }
      }

      // 3. Set brand & load buyers
      setBrand(existingBrand)
      if (existingBrand.currency) {
        setCurrency(existingBrand.currency as any)
      }

      const { data: buyersData } = await supabase
        .from('buyers')
        .select('*')
        .eq('brand_id', existingBrand.id)
        .order('created_at', { ascending: false })

      if (buyersData) setBuyers(buyersData as Buyer[])
      setLoading(false)
    }

    init()
  }, [])

  // ✅ Dynamic Calculations
  const totalBuyers = buyers.length
  const goldMembers = buyers.filter(b => b.current_tier === 'Gold').length
  
  const vipDrops = buyers
    .filter(b => ['Gold', 'Silver'].includes(b.current_tier))
    .reduce((acc, b) => acc + (b.total_drops_purchased || 0), 0)
  const vipGeneratedRevenue = vipDrops * AVG_DROP_PRICE

  const repeatBuyers = buyers.filter(b => b.total_drops_purchased > 1).length
  const retentionRate = totalBuyers > 0 ? Math.round((repeatBuyers / totalBuyers) * 100) : 0

  // ✅ Real Currency Converter
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

  // ✅ CSV Export Handler
  const handleExportCSV = () => {
    if (buyers.length === 0) return
    const headers = ['Name', 'Email', 'Tier', 'Total Drops', 'Joined Date']
    const rows = buyers.map(buyer => [
      buyer.full_name || 'Guest',
      buyer.primary_email,
      buyer.current_tier,
      buyer.total_drops_purchased,
      new Date(buyer.created_at).toLocaleDateString()
    ])
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `retinue_customers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      {/* Top Header Controls */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm h-[73px]">
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-slate-100 border-none text-sm font-medium rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Track your drop retention performance and VIP growth.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: VIP Generated Revenue */}
          <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Live Data</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">VIP Generated Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatMoney(vipGeneratedRevenue)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">From Gold & Silver members only</p>
          </div>

          {/* Metric 2: Total Active Buyers */}
          <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Total Tracked Buyers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalBuyers}</h3>
            <p className="text-xs text-slate-400 mt-2">Across all drops</p>
          </div>

          {/* Metric 3: Gold Tier Members */}
          <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Gold VIP Members</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{goldMembers}</h3>
            <p className="text-xs text-slate-400 mt-2">Eligible for Early Access</p>
          </div>

          {/* Metric 4: Retention Rate */}
          <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Repeat Purchase Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{retentionRate}%</h3>
            <p className="text-xs text-slate-400 mt-2">Buyers with 2+ drops</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/shopify/customers" className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white">
                <Users className="w-5 h-5 text-slate-700" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">View All Customers</p>
                <p className="text-xs text-slate-500">Manage tiers & export data</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </Link>

          <Link href="/shopify/analytics" className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white">
                <BarChart3 className="w-5 h-5 text-slate-700" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Analytics Report</p>
                <p className="text-xs text-slate-500">Deep dive into performance</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </Link>

          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white">
                <Download className="w-5 h-5 text-slate-700" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Export Customer Data</p>
                <p className="text-xs text-slate-500">Download CSV for Klaviyo</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </button>
        </div>

        {/* Recent Activity Preview - LIMITED TO TOP 5 */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Recent VIP Activity</h2>
            <Link href="/shopify/customers" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium">Total Drops</th>
                <th className="px-6 py-3 font-medium">Last Order</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buyers.slice(0, 5).map((buyer) => (
                <tr key={buyer.id} className="hover:bg-slate-50">
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
                  <td className="px-6 py-4 text-slate-600">{buyer.total_drops_purchased} Drops</td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {buyer.last_order_date 
                      ? new Date(buyer.last_order_date).toLocaleDateString() 
                      : <span className="text-slate-400 italic">N/A</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {buyers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}