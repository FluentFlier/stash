"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home, Inbox, MessageSquare, Folder, Bell, Calendar,
    Settings, User, ChevronLeft, Menu
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const MENU_ITEMS = [
    { title: "Dashboard", icon: Home, href: "/" },
    { title: "Captures", icon: Inbox, href: "/captures" },
    { title: "Chat", icon: MessageSquare, href: "/chat" },
    { title: "Collections", icon: Folder, href: "/collections" },
    { title: "Reminders", icon: Bell, href: "/reminders" },
    { title: "Calendar", icon: Calendar, href: "/calendar" },
]

export function SidebarV2() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isMobileOpen, setIsMobileOpen] = React.useState(false)

    // Auto-collapse on small screens (< 1024px)
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true)
            } else {
                setIsCollapsed(false)
            }
        }

        // Set initial
        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <>
            {/* Mobile Trigger */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button size="icon" variant="outline" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[80px]" : "w-[260px]",
                    // Mobile behavior: hidden by default, slide in if open
                    "hidden lg:flex flex-col", // Always flex on desktop
                    isMobileOpen ? "flex w-[260px] translate-x-0" : "max-lg:translate-x-[-100%]"
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
                    <div className={cn("flex flex-col overflow-hidden transition-all duration-300", isCollapsed && "opacity-0 w-0")}>
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">Stash</span>
                        <span className="text-sm font-semibold text-foreground whitespace-nowrap">Autonomous Vault</span>
                    </div>
                    {isCollapsed && (
                        <div className="absolute left-0 w-full flex justify-center">
                            <span className="font-bold text-xl">S</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-white shadow-sm text-primary font-semibold border border-gray-100 dark:bg-white/10 dark:border-white/5 dark:text-white"
                                        : "text-muted-foreground hover:bg-black/5 hover:text-black dark:hover:bg-white/5 dark:hover:text-white"
                                )}
                                title={isCollapsed ? item.title : undefined}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary dark:text-white" : "text-muted-foreground group-hover:text-black dark:group-hover:text-white")} />
                                <span className={cn(
                                    "whitespace-nowrap overflow-hidden transition-all duration-300",
                                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                                )}>
                                    {item.title}
                                </span>

                                {/* Active Indicator Pilla */}
                                {isActive && !isCollapsed && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-sidebar-border/50">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-300", isCollapsed && "w-0 opacity-0")}>
                            Settings
                        </span>
                    </Link>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="mt-2 w-full flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hidden lg:flex"
                    >
                        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper - Handles Margin Logic */}
            <main
                className={cn(
                    "min-h-screen transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"
                )}
            >
                {/* Mobile menu backdrop */}
                {isMobileOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}

                {/* Actual Page Content */}
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl animate-in fade-in duration-500">
                    {/* Top Spacer for Mobile Menu Button */}
                    <div className="h-10 lg:hidden" />
                    {/* Content Slot */}
                </div>
            </main>
        </>
    )
}
