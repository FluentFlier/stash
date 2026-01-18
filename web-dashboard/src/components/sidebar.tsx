"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home, Inbox, MessageSquare, Folder, Bell, Calendar, Settings, Menu, X
} from "lucide-react"
import { useState } from "react"

const NAV_ITEMS = [
    { title: "Dashboard", href: "/", icon: Home },
    { title: "Collections", href: "/collections", icon: Folder },
    { title: "Captures", href: "/captures", icon: Inbox },
    { title: "Chat", href: "/chat", icon: MessageSquare },
    { title: "Reminders", href: "/reminders", icon: Bell },
    { title: "Calendar", href: "/calendar", icon: Calendar },
]

export function Sidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl border border-[#d8deea] shadow-sm"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-40 h-screen w-[260px] bg-[#f1f5fb] border-r border-[#d8deea]
        flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-[#e6ebf4]">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b879f]">Stash</span>
                        <p className="text-sm font-semibold text-[#1c2433]">Autonomous Vault</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all
                  ${isActive
                                        ? 'bg-white text-[#000000] shadow-sm border border-[#e6ebf4]'
                                        : 'text-[#55607a] hover:bg-white/50 hover:text-[#1c2433]'}
                `}
                            >
                                <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#000000]' : 'text-[#7b879f]'}`} />
                                <span>{item.title}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-[#e6ebf4]">
                    <Link
                        href="/settings"
                        className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all
              ${pathname === '/settings'
                                ? 'bg-white text-[#000000] shadow-sm border border-[#e6ebf4]'
                                : 'text-[#55607a] hover:bg-white/50 hover:text-[#1c2433]'}
            `}
                    >
                        <Settings className="h-[18px] w-[18px] text-[#7b879f]" />
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>
        </>
    )
}
