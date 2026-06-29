import {
  LayoutDashboard,
  Activity,
  Server,
  FileBarChart,
  BellRing,
  Boxes,
  MapPin,
  Monitor,
  Settings,
  Users,
  LogOut,
  Server as ServerLogo,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const mainItems: Item[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Monitoring", url: "/monitoring", icon: Activity },
  { title: "Servers", url: "/servers", icon: Server },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Alerts", url: "/alerts", icon: BellRing },
  { title: "Inventory", url: "/inventory", icon: Boxes },
];

const masterItems: Item[] = [
  { title: "Locations", url: "/locations", icon: MapPin },
  { title: "OS Master", url: "/os", icon: Monitor },
];

const systemItems: Item[] = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Users", url: "/users", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const renderGroup = (label: string, items: Item[]) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <NavLink to={item.url} end={item.url === "/"} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-md bg-gradient-accent flex items-center justify-center shadow-glow shrink-0">
            <ServerLogo className="w-4 h-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-sidebar-accent-foreground">ServerOps</p>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                Inventory Console
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Workspace", mainItems)}
        {renderGroup("Masters", masterItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={() => toast.info("Logout coming soon")}
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
