import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { useParams } from "wouter";
import { 
  useAdminUsers,
  useAdminCreators,
  useAdminProducts,
  useAdminOrders,
  useAdminSettings,
  useListCategories,
  useGetSession,
  useAdminCreatorApplications,
  useApproveCreatorApplication,
  useRejectCreatorApplication
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
import { AdminLiveClassesStandalone } from "@/components/dashboard/LiveClassesStandalone";
import { LiveClassroom } from "@/components/dashboard/LiveClassroom";

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

  if (section === "live-classes" && id && action === "classroom") {
    return (
      <DashboardLayout role="admin">
        <LiveClassroom id={Number(id)} backUrl="/dashboard/admin/courses" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      {section === "overview" && <Overview />}
      {section === "users" && <UsersList />}
      {section === "creators" && <CreatorsList />}
      {section === "applications" && <ApplicationsList />}
      {section === "courses" && !id && <AdminCourseStudioList />}
      {section === "products" && <ProductsList />}
      {section === "live-classes" && !id && <AdminLiveClassesStandalone />}
      {section === "orders" && <OrdersList />}
      {section === "categories" && <CategoriesList />}
      {section === "settings" && <SettingsView />}
    </DashboardLayout>
  );
}

function ApplicationsList() {
  const { data: applications, isLoading } = useAdminCreatorApplications({ status: "pending" });
  const approve = useApproveCreatorApplication();
  const reject = useRejectCreatorApplication();
  const refresh = () => window.location.reload();
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div><h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Creator Applications</h2><p className="text-[16px] text-[#4D4D4D] mt-1">Review detailed teaching profiles before enabling creator tools.</p></div>
      {isLoading ? <div className="py-20 text-center">Loading applications…</div> : !applications?.length ? <div className="bg-white border rounded-xl p-10 text-center text-[#69737D]">No pending applications.</div> : <div className="space-y-5">{applications.map((item: any) => {
        const app = item.application ?? item;
        const user = item.user;
        return <article key={app.id} className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-bold text-black">{app.displayName}</h3><p className="text-primary">{app.headline}</p><p className="text-sm text-[#69737D]">{user?.email} · {app.experienceYears} years experience</p></div><div className="flex gap-2"><Button disabled={approve.isPending} onClick={() => approve.mutate({ id: app.id }, { onSuccess: refresh })}>Approve</Button><Button variant="outline" disabled={reject.isPending} onClick={() => { const reason = window.prompt("Rejection reason"); if (reason) reject.mutate({ id: app.id, data: { reason } }, { onSuccess: refresh }); }}>Reject</Button></div></div>
          <div className="grid md:grid-cols-2 gap-5 mt-5 text-sm"><div><p className="font-bold mb-1">Expertise</p><p className="text-[#4D4D4D]">{app.expertise}</p></div><div><p className="font-bold mb-1">Teaching topics</p><p className="text-[#4D4D4D]">{app.teachingTopics?.join(", ")}</p></div><div><p className="font-bold mb-1">Course proposal</p><p className="text-[#4D4D4D] whitespace-pre-wrap">{app.courseProposal}</p></div><div><p className="font-bold mb-1">Target audience</p><p className="text-[#4D4D4D]">{app.targetAudience}</p></div><div className="md:col-span-2"><p className="font-bold mb-1">Motivation</p><p className="text-[#4D4D4D] whitespace-pre-wrap">{app.motivation}</p></div></div>
        </article>;
      })}</div>}
    </div>
  );
}

function Overview() {
  const { data: session } = useGetSession();
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Platform Administration</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Manage global settings, users, and infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
          <div className="w-12 h-12 bg-[#EAEFF8] text-[#224EA1] rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-[18px] font-bold text-black mb-2">User Management</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-4">View and manage all students and creators on the platform.</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
          <div className="w-12 h-12 bg-[#F1EEFC] text-[#704FE6] rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-[18px] font-bold text-black mb-2">Content Moderation</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-4">Review published courses and digital products.</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
          <div className="w-12 h-12 bg-[#E3F9EF] text-primary rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-[18px] font-bold text-black mb-2">Platform Settings</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-4">Configure global settings, payments, and integrations.</p>
        </div>
      </div>
    </div>
  );
}

function UsersList() {
  const { data: users, isLoading } = useAdminUsers();
  const [busy, setBusy] = useState<number | null>(null);
  const updateCreator = async (id: number, enabled: boolean) => {
    setBusy(id);
    await fetch(`/api/admin/users/${id}/creator`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    window.location.reload();
  };
  const updateEnrollment = async (id: number, courseId: string, method: "POST" | "DELETE") => {
    if (!courseId) return;
    setBusy(id);
    await fetch(`/api/admin/users/${id}/enrollments/${courseId}`, { method, credentials: "include", headers: method === "POST" ? { "Content-Type": "application/json" } : undefined, body: method === "POST" ? JSON.stringify({ courseId: Number(courseId) }) : undefined });
    setBusy(null);
  };
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">All Users</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Manage all accounts across the platform.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">ID</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Name</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Email</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Role</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{user.id}</td>
                  <td className="p-4 font-bold text-[14px] text-black">{user.name}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{user.email}</td>
                  <td className="p-4">
                    <Badge className="bg-gray-100 text-[#394649] hover:bg-gray-100 border-none shadow-none uppercase text-[10px] font-bold">{user.role}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {user.role !== "admin" && <Button size="sm" variant="outline" disabled={busy === user.id} onClick={() => updateCreator(user.id, user.role !== "creator")}>{user.role === "creator" ? "Revoke creator" : "Grant creator"}</Button>}
                      {user.role !== "admin" && <Button size="sm" variant="outline" disabled={busy === user.id} onClick={() => { const courseId = window.prompt("Course ID to enroll"); if (courseId) updateEnrollment(user.id, courseId, "POST"); }}>Enroll</Button>}
                      {user.role !== "admin" && <Button size="sm" variant="outline" disabled={busy === user.id} onClick={() => { const courseId = window.prompt("Course ID to remove"); if (courseId) updateEnrollment(user.id, courseId, "DELETE"); }}>Remove course</Button>}
                    </div>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Creators</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Manage educators and content creators.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Name</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Email</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {creators?.map((creator) => (
                <tr key={creator.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-[14px] text-black">{creator.name}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{creator.email}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D]">
                    {creator.createdAt ? new Date(creator.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">All Products</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Monitor all digital products.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Title</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Type</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Price</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {products?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-[14px] text-black">{item.title}</td>
                  <td className="p-4"><Badge className="bg-gray-100 text-[#394649] hover:bg-gray-100 border-none shadow-none uppercase text-[10px] font-bold">{item.type}</Badge></td>
                  <td className="p-4 font-bold text-[14px]">${(item.priceMinor / 100).toFixed(2)} {item.currency}</td>
                  <td className="p-4">
                    <Badge className={item.status === 'published' ? 'bg-[#E3F9EF] text-primary hover:bg-[#E3F9EF] border-none shadow-none font-medium' : 'bg-gray-100 text-[#9794AA] hover:bg-gray-100 border-none shadow-none font-medium'}>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Global Orders</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">View all transactions across the platform.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">ID</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Item</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {orders?.map((order: any, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{order.id}</td>
                  <td className="p-4 font-bold text-[14px] text-black">{order.title}</td>
                  <td className="p-4 font-bold text-[14px] text-primary">${((order.priceMinor ?? 0) / 100).toFixed(2)}</td>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Categories</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Manage global product categories.</p>
        </div>
        <CategoryFormDialog>
          <Button className="h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
            <Plus className="w-4 h-4 mr-2" /> 
            Add Category
          </Button>
        </CategoryFormDialog>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Name</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Slug</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Description</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {categories?.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-[14px] text-black">{cat.name}</td>
                  <td className="p-4 text-[14px] font-mono text-[#9794AA]">{cat.slug}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{cat.description || "-"}</td>
                  <td className="p-4 text-right">
                    <CategoryFormDialog category={cat}>
                      <Button className="h-[36px] px-4 border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 rounded-md text-[13px] font-medium">Edit</Button>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Platform Settings</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Configure global variables.</p>
        </div>
        <SettingFormDialog>
          <Button className="h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
            <Plus className="w-4 h-4 mr-2" /> 
            Add/Update Setting
          </Button>
        </SettingFormDialog>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Key</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Value</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {(Array.isArray(settings) ? settings : Object.entries(settings || {}).map(([key, value]) => ({ key, value }))).map((setting: any) => {
                const key = setting.key;
                const value = setting.value;
                return (
                <tr key={key} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-[14px] font-bold text-black">{key}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D] max-w-[200px] truncate">{String(value)}</td>
                  <td className="p-4 text-right">
                    <SettingFormDialog settingKey={key} settingValue={String(value)}>
                      <Button className="h-[36px] px-4 border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 rounded-md text-[13px] font-medium">Edit</Button>
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
