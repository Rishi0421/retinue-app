// src/app/shopify/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { 
  Users, Trophy, DollarSign, TrendingUp, 
  ArrowRight, Download, Settings, BarChart3 
} from 'lucide-react'

const TEST_BRAND_ID = '2eac07e1-3682-4aa4-8c73-937855a9e7ac' 

export default async function ShopifyAppPage() {
  // Fetch brand data & buyers
  const { data: buyers } = await supabase
    .from('buyers')
    .select('*')
    .eq('brand_id', TEST_BRAND_ID)
    .order('created_at', { ascending: false })

  // Calculate Real Metrics
  const totalBuyers = buyers?.length || 0
  const goldMembers = buyers?.filter(b => b.current_tier === 'Gold').length || 0
  const silverMembers = buyers?.filter(b => b.current_tier === 'Silver').length || 0
  
  // Mock Revenue Calculation (Real app mein orders table se aayega)
  // Abhi ke liye drops * avg_price maan rahe hain
  const totalDrops = buyers?.reduce((acc, b) => acc + (b.total_drops_purchased || 0), 0) || 0
  const estimatedRevenue = totalDrops * 4500 // Assuming avg drop price ₹4500
  const vipRevenue = (goldMembers * 5 * 4500) + (silverMembers * 3 * 4500) // VIP contribution

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
          <span className="text-xl font-bold tracking-tight">Retinue</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Currency Toggle (UI Only for now) */}
          <select className="bg-slate-100 border-none text-sm font-medium rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
          
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Track your drop retention performance and VIP growth.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: VIP Generated Revenue (USP Feature) */}
          <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% vs last month</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">VIP Generated Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{vipRevenue.toLocaleString()}</h3>
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
            <h3 className="text-2xl font-bold text-slate-900 mt-1">34%</h3>
            <p className="text-xs text-slate-400 mt-2">Buyers with 2+ drops</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
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
          </button>

          <button className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
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
          </button>

          <button className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
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

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Recent VIP Activity</h2>
            <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Tier Change</th>
                <th className="px-6 py-3 font-medium">Total Drops</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buyers && buyers.slice(0, 5).map((buyer: any) => (
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
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {(!buyers || buyers.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}