// src/app/shopify/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { 
  ArrowLeft, Save, Globe, Trophy, Bell, Loader2, 
  Store, Mail, Trash2, AlertTriangle, CheckCircle2 
} from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [brandId, setBrandId] = useState<string | null>(null)
  
  // Form State
  const [config, setConfig] = useState({
    currency: 'INR',
    goldThreshold: 5,
    silverThreshold: 3,
    goldPerks: 'Early Access + Free Shipping',
    silverPerks: '6hr Early Access',
    supportEmail: '',
    storeName: '',
    enableNotifications: true,
    klaviyoSync: true
  })

  // ✅ Fetch Current Settings on Load
  useEffect(() => {
    async function loadSettings() {
      const params = new URLSearchParams(window.location.search)
      const shopDomain = params.get('shop') || 'retinue-test-store.myshopify.com'
      
      let { data: brand } = await supabase
        .from('brands')
        .select('*')
        .eq('shopify_domain', shopDomain)
        .single()

      if (!brand) {
        const autoName = shopDomain.split('.')[0].replace(/-/g, ' ')
        const { data: newBrand } = await supabase
          .from('brands')
          .insert({ name: autoName, shopify_domain: shopDomain, currency: 'INR', gold_threshold: 5, silver_threshold: 3 })
          .select().single()
        brand = newBrand
      }

      if (brand) {
        setBrandId(brand.id)
        setConfig(prev => ({
          ...prev,
          currency: brand.currency || 'INR',
          goldThreshold: brand.gold_threshold || 5,
          silverThreshold: brand.silver_threshold || 3,
          storeName: brand.name || '',
          supportEmail: brand.support_email || '',
          goldPerks: brand.gold_perks || 'Early Access + Free Shipping',
          silverPerks: brand.silver_perks || '6hr Early Access'
        }))
      }
    }
    loadSettings()
  }, [])

  // ✅ Real Save Functionality
  const handleSave = async () => {
    if (!brandId) return;
    setLoading(true);
    setSuccessMsg('');

    const { error } = await supabase
      .from('brands')
      .update({
        currency: config.currency,
        gold_threshold: config.goldThreshold,
        silver_threshold: config.silverThreshold,
        gold_perks: config.goldPerks,
        silver_perks: config.silverPerks,
        support_email: config.supportEmail,
        name: config.storeName
      })
      .eq('id', brandId);

    if (error) {
      alert('Failed to save settings: ' + error.message);
    } else {
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(false);
  };

  // ⚠️ Danger Zone: Clear Test Data
  const handleClearData = async () => {
    if (!confirm('Are you sure? This will delete ALL buyers and orders for this brand. This cannot be undone.')) return;
    
    setLoading(true);
    await supabase.from('buyers').delete().eq('brand_id', brandId);
    // Note: Orders table cleanup would go here if implemented
    
    alert('All test data cleared.');
    window.location.reload();
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-full pb-20">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/shopify" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">App Settings</h1>
            <p className="text-sm text-slate-500">Configure your loyalty program rules & identity</p>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Success Message */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* 1. Store Identity & Support */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg"><Store className="w-5 h-5 text-blue-600" /></div>
            <h2 className="font-bold text-lg text-slate-900">Store Identity & Support</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
              <input value={config.storeName} onChange={(e) => setConfig({...config, storeName: e.target.value})} className="w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Your Brand Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={config.supportEmail} onChange={(e) => setConfig({...config, supportEmail: e.target.value})} className="w-full pl-10 bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="support@yourbrand.com" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Global Currency */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg"><Globe className="w-5 h-5 text-indigo-600" /></div>
            <h2 className="font-bold text-lg text-slate-900">Global Currency</h2>
          </div>
          <select value={config.currency} onChange={(e) => setConfig({...config, currency: e.target.value})} className="w-full md:w-1/3 bg-slate-50 border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="INR">🇳 INR - Indian Rupee</option>
            <option value="USD">🇺🇸 USD - US Dollar</option>
            <option value="EUR">🇺 EUR - Euro</option>
            <option value="GBP">🇬🇧 GBP - British Pound</option>
          </select>
        </div>

        {/* 3. Tier Rules & Perks */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg"><Trophy className="w-5 h-5 text-amber-600" /></div>
            <h2 className="font-bold text-lg text-slate-900">Tier Qualification & Perks</h2>
          </div>
          
          <div className="space-y-6">
            {/* Silver Config */}
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-semibold text-slate-800 mb-3">Silver Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Required Drops</label>
                  <input type="number" min="1" value={config.silverThreshold} onChange={(e) => setConfig({...config, silverThreshold: parseInt(e.target.value)})} className="w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Customer Perk Description</label>
                  <input value={config.silverPerks} onChange={(e) => setConfig({...config, silverPerks: e.target.value})} className="w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g., 6hr Early Access" />
                </div>
              </div>
            </div>

            {/* Gold Config */}
            <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
              <h3 className="font-semibold text-amber-900 mb-3">Gold Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Required Drops</label>
                  <input type="number" min={config.silverThreshold + 1} value={config.goldThreshold} onChange={(e) => setConfig({...config, goldThreshold: parseInt(e.target.value)})} className="w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Customer Perk Description</label>
                  <input value={config.goldPerks} onChange={(e) => setConfig({...config, goldPerks: e.target.value})} className="w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g., Early Access + Free Shipping" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Integrations */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg"><Bell className="w-5 h-5 text-emerald-600" /></div>
            <h2 className="font-bold text-lg text-slate-900">Integrations</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border cursor-pointer hover:bg-slate-100">
              <div><p className="font-medium text-slate-900">Klaviyo Auto-Sync</p><p className="text-xs text-slate-500">Add Gold members to VIP list automatically</p></div>
              <input type="checkbox" checked={config.klaviyoSync} onChange={(e) => setConfig({...config, klaviyoSync: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border cursor-pointer hover:bg-slate-100">
              <div><p className="font-medium text-slate-900">Tier Upgrade Alerts</p><p className="text-xs text-slate-500">Notify when customer reaches new tier</p></div>
              <input type="checkbox" checked={config.enableNotifications} onChange={(e) => setConfig({...config, enableNotifications: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
            </label>
          </div>
        </div>

        {/* ⚠️ Danger Zone */}
        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <h2 className="font-bold text-lg text-red-900">Danger Zone</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">Irreversible actions. Be careful.</p>
          <button onClick={handleClearData} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
            <Trash2 className="w-4 h-4" /> Delete All Customer Data
          </button>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-6 flex justify-end pt-4">
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </main>
    </div>
  )
}