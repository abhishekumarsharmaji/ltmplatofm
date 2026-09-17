import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useParams } from "wouter";
import { 
  useAdminUsers,
  useAdminCreators,
  useAdminProducts,
  useAdminOrders,
  useAdminSettings,
  useListCategories,
  useGetSession
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { 
  Settings, Users, ShieldAlert, Activity, Globe, Paintbrush, 
  BookOpen, Package, ShoppingCart, Award, Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryFormDialog } from "@/components/dashboard/CategoryFormDialog";
import { SettingFormDialog } from "@/components/dashboard/SettingFormDialog";

import { AdminCourseStudioList } from "./admin/AdminCourseStudioList";
import { AdminCourseStudio } from "./admin/AdminCourseStudio";

export default function AdminDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const id = params.id;
  const action = params.action;
  
  if (section === "courses" && id && action === "studio") {
    return (
      <DashboardLayout role="admin">
        <AdminCourseStudio productId={Number(id)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      {section === "overview" && <Overview />}
      {section === "users" && <UsersList />}
      {section === "creators" && <CreatorsList />}
      {section === "courses" && <AdminCourseStudioList />}
      {section === "products" && <ProductsList />}
      {section === "orders" && <OrdersList />}
      {section === "categories" && <CategoriesList />}
      {section === "settings" && <SettingsView />}
    </DashboardLayout>
  );
}

function Overview() {
  const { data: session } = useGetSession();
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Administration</h2>
        <p className="text-muted-foreground mt-1">Manage global settings, users, and infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors group cursor-pointer">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">User Management</h3>
          <p className="text-sm text-muted-foreground mb-4">View and manage all students and creators on the platform.</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors group cursor-pointer">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">Content Moderation</h3>
          <p className="text-sm text-muted-foreground mb-4">Review published courses and digital products.</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-colors group cursor-pointer">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">Platform Settings</h3>
          <p className="text-sm text-muted-foreground mb-4">Configure global settings, payments, and integrations.</p>
        </div>
      </div>

    </div>
  );
}

function UsersList() {
  const { data: users, isLoading } = useAdminUsers();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Users</h2>
        <p className="text-muted-foreground mt-1">Manage all accounts across the platform.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">ID</th>
                <th className="p-4 font-medium text-muted-foreground">Name</th>
                <th className="p-4 font-medium text-muted-foreground">Email</th>
                <th className="p-4 font-medium text-muted-foreground">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="p-4 text-sm text-muted-foreground">{user.id}</td>
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-sm">{user.email}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreatorsList() {
  const { data: creators, isLoading } = useAdminCreators();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Creators</h2>
        <p className="text-muted-foreground mt-1">Manage educators and content creators.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Name</th>
                <th className="p-4 font-medium text-muted-foreground">Email</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {creators?.map((creator: any) => (
                <tr key={creator.id} className="hover:bg-muted/30">
                  <td className="p-4 font-medium">{creator.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{creator.email}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function ProductsList() {
  const { data: products, isLoading } = useAdminProducts();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Products</h2>
        <p className="text-muted-foreground mt-1">Monitor all digital products.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Title</th>
                <th className="p-4 font-medium text-muted-foreground">Type</th>
                <th className="p-4 font-medium text-muted-foreground">Price</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products?.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-4 font-medium">{item.title}</td>
                  <td className="p-4"><Badge variant="outline" className="uppercase text-[10px]">{item.type}</Badge></td>
                  <td className="p-4 font-medium">${(item.priceMinor / 100).toFixed(2)} {item.currency}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className={item.status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrdersList() {
  const { data: orders, isLoading } = useAdminOrders();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Global Orders</h2>
        <p className="text-muted-foreground mt-1">View all transactions across the platform.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">ID</th>
                <th className="p-4 font-medium text-muted-foreground">Item</th>
                <th className="p-4 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders?.map((order: any, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-4 text-sm text-muted-foreground">{order.id}</td>
                  <td className="p-4 font-medium">{order.title}</td>
                  <td className="p-4 font-bold text-emerald-500">${((order.priceMinor ?? 0) / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoriesList() {
  const { data: categories, isLoading } = useListCategories();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground mt-1">Manage global product categories.</p>
        </div>
        <CategoryFormDialog>
          <Button><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
        </CategoryFormDialog>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Name</th>
                <th className="p-4 font-medium text-muted-foreground">Slug</th>
                <th className="p-4 font-medium text-muted-foreground">Description</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories?.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-muted/30">
                  <td className="p-4 font-bold">{cat.name}</td>
                  <td className="p-4 text-sm font-mono text-muted-foreground">{cat.slug}</td>
                  <td className="p-4 text-sm text-muted-foreground">{cat.description || "-"}</td>
                  <td className="p-4 text-right">
                    <CategoryFormDialog category={cat}>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </CategoryFormDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsView() {
  const { data: settings, isLoading } = useAdminSettings();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground mt-1">Configure global variables.</p>
        </div>
        <SettingFormDialog>
          <Button><Plus className="w-4 h-4 mr-2" /> Add/Update Setting</Button>
        </SettingFormDialog>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Key</th>
                <th className="p-4 font-medium text-muted-foreground">Value</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(Array.isArray(settings) ? settings : Object.entries(settings || {}).map(([key, value]) => ({ key, value }))).map((setting: any) => {
                const key = setting.key;
                const value = setting.value;
                return (
                <tr key={key} className="hover:bg-muted/30">
                  <td className="p-4 font-mono text-sm">{key}</td>
                  <td className="p-4 text-sm max-w-[200px] truncate">{String(value)}</td>
                  <td className="p-4 text-right">
                    <SettingFormDialog settingKey={key} settingValue={String(value)}>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </SettingFormDialog>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
