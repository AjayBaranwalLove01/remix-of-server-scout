import { TopBar } from "@/components/inventory/TopBar";
import { DashboardStats } from "@/components/inventory/DashboardStats";
import { InventoryTable } from "@/components/inventory/InventoryTable";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Server Inventory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time view of your Windows fleet — click any field to edit inline.
          </p>
        </div>
        <DashboardStats />
        <InventoryTable />
      </main>
    </div>
  );
};

export default Index;
