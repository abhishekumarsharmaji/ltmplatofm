import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Settings, ShieldAlert, Activity, Globe, Paintbrush } from "lucide-react";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Administration</h2>
          <p className="text-muted-foreground mt-1">Manage global settings, tenants, and infrastructure.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Tenant Management</h3>
            <p className="text-sm text-muted-foreground mb-4">View and manage all schools (tenants) hosted on the platform. Monitor usage and billing.</p>
            <span className="text-sm font-medium text-blue-500">Manage 12 active tenants →</span>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Paintbrush className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Global Branding</h3>
            <p className="text-sm text-muted-foreground mb-4">Configure the default platform look, landing pages, and email templates.</p>
            <span className="text-sm font-medium text-purple-500">Edit branding →</span>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Access & Roles</h3>
            <p className="text-sm text-muted-foreground mb-4">Define platform-wide roles and configure single sign-on (SSO) settings.</p>
            <span className="text-sm font-medium text-emerald-500">Configure access →</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-bold">System Health</h3>
            </div>
            <Button variant="outline" size="sm">View Detailed Logs</Button>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Database Storage</span>
                <span>45% (4.5GB / 10GB)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[45%]" />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Monthly API Requests</span>
                <span>82% (82k / 100k)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[82%]" />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Active WebSocket Connections</span>
                <span className="text-emerald-500">Healthy (245)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
