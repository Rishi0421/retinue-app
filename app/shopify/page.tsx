// src/app/shopify/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { Users, Trophy, Package, Mail } from 'lucide-react'

// Note: Real app mein yahan session validation hogi
// Abhi ke liye hum test brand ID use karenge
const TEST_BRAND_ID = '2eac07e1-3682-4aa4-8c73-937855a9e7ac' 

export default async function ShopifyAppPage() {
  // Fetch ONLY this brand's buyers
  const { data: buyers } = await supabase
    .from('buyers')
    .select('*')
    .eq('brand_id', TEST_BRAND_ID)
    .order('created_at', { ascending: false })

  const stats = {
    totalBuyers: buyers?.length || 0,
    goldTier: buyers?.filter(b => b.current_tier === 'Gold').length || 0,
    totalDrops: buyers?.reduce((acc, b) => acc + (b.total_drops_purchased || 0), 0) || 0
  }

  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      {/* Header */}
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Retinue Loyalty</h1>
        <p className="text-slate-500 text-sm">Manage your drop retention & VIP tiers</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">Total Buyers</span>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{stats.totalBuyers}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">Gold Members</span>
          </div>
          <p className="text-3xl font-bold text-amber-700">{stats.goldTier}</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">Total Drops Sold</span>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{stats.totalDrops}</p>
        </div>
      </div>

      {/* Buyers Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-slate-50 p-4 border-b">
          <h2 className="font-semibold text-slate-800">Your Customers</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b">
            <tr>
              <th className="p-4 font-semibold text-slate-500">Name</th>
              <th className="p-4 font-semibold text-slate-500">Email</th>
              <th className="p-4 font-semibold text-slate-500">Tier</th>
              <th className="p-4 font-semibold text-slate-500">Drops</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {buyers && buyers.length > 0 ? (
              buyers.map((buyer: any) => (
                <tr key={buyer.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium">{buyer.full_name || 'Guest'}</td>
                  <td className="p-4 text-slate-600 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> {buyer.primary_email}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      buyer.current_tier === 'Gold' ? 'bg-amber-100 text-amber-800' :
                      buyer.current_tier === 'Silver' ? 'bg-slate-200 text-slate-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {buyer.current_tier}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">{buyer.total_drops_purchased}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No customers yet. Start selling drops!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}