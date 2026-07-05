// src/app/shopify/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BarChart3, Settings } from 'lucide-react'

export default function ShopifyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/shopify', icon: LayoutDashboard },
    { name: 'Customers', href: '/shopify/customers', icon: Users },
    { name: 'Analytics', href: '/shopify/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/shopify/settings', icon: Settings },
  ]

  // Some pages like Onboarding might want to bypass the sidebar if it's rendered here,
  // but since Onboarding handles its own full-screen layout inside page.tsx, 
  // it might look weird inside a layout. However, it's acceptable for now.

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex-col hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 h-[73px]">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
          <span className="text-xl font-bold tracking-tight">Retinue</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>
      </div>
    </div>
  )
}
