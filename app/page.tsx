// src/app/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { Users, Building2, Activity, ShieldCheck, Mail, Trophy } from 'lucide-react'

interface Buyer {
  id: string | number;
  full_name: string | null;
  primary_email: string;
  current_tier: string;
  total_drops_purchased: number;
}

export default async function Home() {
  // Fetch Brands
  const { data: brands } = await supabase.from('brands').select('*')
  
  // Fetch Recent Buyers
  const { data: buyers } = await supabase.from('buyers').select('*').limit(10)

  const stats = [
    { label: 'Total Brands', value: brands?.length || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Buyers', value: buyers?.length || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'System Status', value: 'Active', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 font-sans selection:bg-indigo-200">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-indigo-600" />
              Retinue Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">B2B Drop Retention Platform</p>
          </div>
          <div className="px-4 py-2 bg-white rounded-full border shadow-sm text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Live Analytics
          </div>
        </header>

        {/* Connect Button Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Connect Your Shopify Store</h2>
          <p className="text-slate-500 mb-6 font-medium">One-click connect to start tracking drop buyers.</p>
          
          <form action="/api/auth" method="GET" className="inline-block w-full sm:w-auto">
            <input type="hidden" name="shop" value="retinue-test-store.myshopify.com" />
            <button 
              type="submit"
              className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-800 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 mx-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.35 7.9c-.35-.35-.8-.55-1.3-.55H17V4.5c0-.83-.67-1.5-1.5-1.5h-7C7.67 3 7 3.67 7 4.5v2.85H4.95c-.5 0-.95.2-1.3.55-.35.35-.55.8-.55 1.3v9.3c0 .5.2.95.55 1.3.35.35.8.55 1.3.55h14.1c.5 0 .95-.2 1.3-.55.35-.35.55-.8.55-1.3v-9.3c0-.5-.2-.95-.55-1.3zM9 4.5h6v2.85H9V4.5zm10 14H5v-9h14v9z"/></svg>
              Connect Shopify Store
            </button>
          </form>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 flex items-center gap-5">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Buyers Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Recent Buyers
            </h2>
            <p className="text-slate-500 text-sm mt-1">A quick view of the latest drop participants.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white">
                <tr>
                  <th className="p-5 font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">Buyer</th>
                  <th className="p-5 font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">Contact</th>
                  <th className="p-5 font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">Loyalty Tier</th>
                  <th className="p-5 font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">Drops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {buyers && buyers.length > 0 ? (
                  buyers.map((buyer: Buyer) => (
                    <tr key={buyer.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="p-5">
                        <div className="font-semibold text-slate-800">{buyer.full_name || 'Guest User'}</div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {buyer.primary_email}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          buyer.current_tier === 'Gold' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          buyer.current_tier === 'Silver' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          <Trophy className="w-3 h-3" />
                          {buyer.current_tier}
                        </span>
                      </td>
                      <td className="p-5 font-semibold text-slate-700">
                        {buyer.total_drops_purchased}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500 font-medium">
                      No buyers found yet. Waiting for new drops...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}