// src/app/shopify/customers/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { 
  ArrowLeft, Search, Filter, Download, 
  ArrowUp, ArrowDown, Loader2
} from 'lucide-react'

interface Buyer {
  id: string;
  full_name: string | null;
  primary_email: string;
  current_tier: string;
  total_drops_purchased: number;
  created_at: string;
  last_order_date?: string | null;
}

type SortField = 'name' | 'drops' | 'date';
type SortOrder = 'asc' | 'desc';

export default function CustomersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [tierFilter, setTierFilter] = useState<string>('All')

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

      // Auto-create if missing (Consistent with Dashboard/Analytics)
      if (!brand) {
        const autoName = shopDomain.split('.')[0].replace(/-/g, ' ')
        const { data: newBrand } = await supabase
          .from('brands')
          .insert({ 
            name: autoName, 
            shopify_domain: shopDomain, 
            currency: 'INR', 
            gold_threshold: 5, 
            silver_threshold: 3 
          })
          .select().single()
        brand = newBrand
      }

      const { data } = await supabase
        .from('buyers')
        .select('*')
        .eq('brand_id', brand.id)
      
      if (data) setBuyers(data as Buyer[])
      setLoading(false)
    }
    init()
  }, [])

  // Filtering & Sorting Logic
  const getFilteredAndSortedBuyers = () => {
    let filtered = [...buyers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.full_name?.toLowerCase().includes(term) || 
        b.primary_email.toLowerCase().includes(term)
      );
    }

    if (tierFilter !== 'All') {
      filtered = filtered.filter(b => b.current_tier === tierFilter);
    }

    filtered.sort((a, b) => {
      let valA: any, valB: any;
      
      if (sortField === 'name') {
        valA = a.full_name || '';
        valB = b.full_name || '';
      } else if (sortField === 'drops') {
        valA = a.total_drops_purchased;
        valB = b.total_drops_purchased;
      } else {
        valA = new Date(a.last_order_date || a.created_at).getTime();
        valB = new Date(b.last_order_date || b.created_at).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const displayBuyers = getFilteredAndSortedBuyers();

  // Export Handler
  const handleExportCSV = () => {
    if (displayBuyers.length === 0) return;
    const headers = ['Name', 'Email', 'Tier', 'Total Drops', 'Last Order'];
    const rows = displayBuyers.map(buyer => [
      buyer.full_name || 'Guest',
      buyer.primary_email,
      buyer.current_tier,
      buyer.total_drops_purchased,
      buyer.last_order_date ? new Date(buyer.last_order_date).toLocaleDateString() : 'N/A'
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `retinue_all_customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-full">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4">
            <Link href="/shopify" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">All Customers</h1>
              <p className="text-sm text-slate-500">{displayBuyers.length} customers found</p>
            </div>
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="All">All Tiers</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th 
                    className="px-6 py-4 font-medium cursor-pointer hover:text-indigo-600 transition-colors select-none"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Customer Name
                      {sortField === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>)}
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Tier</th>
                  <th 
                    className="px-6 py-4 font-medium cursor-pointer hover:text-indigo-600 transition-colors select-none"
                    onClick={() => toggleSort('drops')}
                  >
                    <div className="flex items-center gap-2">
                      Total Drops
                      {sortField === 'drops' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>)}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 font-medium cursor-pointer hover:text-indigo-600 transition-colors select-none"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Last Order
                      {sortField === 'date' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayBuyers.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{buyer.full_name || 'Guest User'}</td>
                    <td className="px-6 py-4 text-slate-600">{buyer.primary_email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        buyer.current_tier === 'Gold' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        buyer.current_tier === 'Silver' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                        'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}>
                        {buyer.current_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{buyer.total_drops_purchased}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {buyer.last_order_date 
                        ? new Date(buyer.last_order_date).toLocaleDateString() 
                        : <span className="text-slate-400 italic">No orders yet</span>}
                    </td>
                  </tr>
                ))}
                {displayBuyers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No customers match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}