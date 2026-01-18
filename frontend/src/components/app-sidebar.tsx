"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Home, Inbox, Settings, MessageSquare, Bell, Folder } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Captures",
    url: "/captures",
    icon: Inbox,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Collections",
    url: "/collections",
    icon: Folder,
  },
  {
    title: "Reminders",
    url: "/reminders",
    icon: Bell,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar className="border-r">
      <SidebarContent className="gap-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`rounded-md transition-colors duration-150 ${
                      pathname === item.url
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <Link href={item.url} aria-current={pathname === item.url ? "page" : undefined}>
                      <item.icon className="size-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={`rounded-md transition-colors duration-150 ${
                    pathname === "/settings"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "hover:bg-accent/50"
                  }`}
                >
                    <Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined}>
                        <Settings className="size-4" />
                        <span className="font-medium">Settings</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
