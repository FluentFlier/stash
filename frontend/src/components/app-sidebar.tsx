import { Calendar, Home, Inbox, Search, Settings, MessageSquare, Layers, Bell, Folder } from "lucide-react"

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
                    className="hover:bg-accent/50 rounded-md transition-colors duration-150"
                  >
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span className="font-medium">{item.title}</span>
                    </a>
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
                  className="hover:bg-accent/50 rounded-md transition-colors duration-150"
                >
                    <a href="/settings">
                        <Settings className="size-4" />
                        <span className="font-medium">Settings</span>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
