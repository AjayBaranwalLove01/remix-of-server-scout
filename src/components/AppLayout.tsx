import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-10 flex items-center border-b border-border bg-card px-2">
            <SidebarTrigger />
            <span className="ml-2 text-xs text-muted-foreground">Toggle navigation</span>
          </div>
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
