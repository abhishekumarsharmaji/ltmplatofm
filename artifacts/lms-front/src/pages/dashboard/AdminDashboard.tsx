import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { lazy, Suspense, useMemo, useState } from "react";
import { useParams } from "wouter";
import { 
  useAdminUsers,
  getAdminUsersQueryKey,
  getAdminUserEnrollmentsQueryKey,
  useAdminCourses,
  useAdminUserEnrollments,
  useAddAdminUserEnrollment,
  useRemoveAdminUserEnrollment,
  useUpdateAdminUserCreatorRole,
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
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Settings, Users, ShieldAlert, Activity, Globe, Paintbrush, 
  BookOpen, Package, ShoppingCart, Award, Plus, Search, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryFormDialog } from "@/components/dashboard/CategoryFormDialog";
import { SettingFormDialog } from "@/components/dashboard/SettingFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const AdminCourseStudioList = lazy(() => import("./admin/AdminCourseStudioList").then((module) => ({ default: module.AdminCourseStudioList })));
const AdminCourseStudio = lazy(() => import("./admin/AdminCourseStudio").then((module) => ({ default: module.AdminCourseStudio })));
const AdminLiveClassesStandalone = lazy(() => import("@/components/dashboard/LiveClassesStandalone").then((module) => ({ default: module.AdminLiveClassesStandalone })));
const LiveClassroom = lazy(() => import("@/components/dashboard/LiveClassroom").then((module) => ({ default: module.LiveClassroom })));

function SectionFallback() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#737373]">Loading workspace…</div>;
}

export default function AdminDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const id = params.id;
  const action = params.action;
  
  if (section === "courses" && id && action === "studio") {
    return (
      <DashboardLayout role="admin">
        <Suspense fallback={<SectionFallback />}><AdminCourseStudio productId={Number(id)} /></Suspense>
      </DashboardLayout>
    );
  }

  if (section === "live-classes" && id && action === "classroom") {
    return (
      <DashboardLayout role="admin">
        <Suspense fallback={<SectionFallback />}><LiveClassroom id={Number(id)} backUrl="/dashboard/admin/courses" /></Suspense>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      {section === "overview" && <Overview />}
      {section === "users" && <UsersList />}
      {section === "creators" && <CreatorsList />}
      {section === "applications" && <ApplicationsList />}
      {section === "courses" && !id && <Suspense fallback={<SectionFallback />}><AdminCourseStudioList /></Suspense>}
      {section === "products" && <ProductsList />}
      {section === "live-classes" && !id && <Suspense fallback={<SectionFallback />}><AdminLiveClassesStandalone /></Suspense>}
      {section === "orders" && <OrdersList />}
      {section === "categories" && <CategoriesList />}
      {section === "settings" && <SettingsView />}
    </DashboardLayout>
  );
}

function ApplicationsList() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const { data: applications, isLoading } = useAdminCreatorApplications({ status });
  const approve = useApproveCreatorApplication();
  const reject = useRejectCreatorApplication();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/admin/creator-applications"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] }),
    ]);
  };
  const handleSuccess = async (message: string) => { await refresh(); toast({ title: message }); };
  const handleError = (error: any) => toast({ title: "Action failed", description: error?.message ?? "Please try again.", variant: "destructive" });
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="flex flex-wrap justify-between gap-4 items-end"><div><h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Creator Applications</h2><p className="text-[16px] text-[#4D4D4D] mt-1">Review detailed teaching profiles before enabling creator tools.</p></div><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-lg border border-[#D9DEE5] bg-white px-3 text-sm"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
      {isLoading ? <div className="py-20 text-center">Loading applications…</div> : !applications?.length ? <div className="bg-white border rounded-xl p-10 text-center text-[#69737D]">No pending applications.</div> : <div className="space-y-5">{applications.map((item: any) => {
        const app = item.application ?? item;
        const user = item.user;
        return <article key={app.id} className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-bold text-black">{app.displayName}</h3><p className="text-primary">{app.headline}</p><p className="text-sm text-[#69737D]">{user?.email} · {app.experienceYears} years experience</p></div>{status === "pending" && <div className="flex gap-2"><Button disabled={approve.isPending} onClick={() => approve.mutate({ id: app.id }, { onSuccess: () => handleSuccess("Application approved"), onError: handleError })}>Approve</Button><Button variant="outline" disabled={reject.isPending} onClick={() => { const reason = window.prompt("Rejection reason"); if (reason) reject.mutate({ id: app.id, data: { reason } }, { onSuccess: () => handleSuccess("Application rejected"), onError: handleError }); }}>Reject</Button></div>}</div>
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
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | "student" | "creator" | "admin">("all");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = useMemo(() => (users ?? []).filter((user: any) => {
    const matchesSearch = !normalizedSearch
      || user.name?.toLowerCase().includes(normalizedSearch)
      || user.email?.toLowerCase().includes(normalizedSearch)
      || String(user.id).includes(normalizedSearch);
    return matchesSearch && (role === "all" || user.role === role);
  }), [users, normalizedSearch, role]);
  const counts = useMemo(() => ({
    total: users?.length ?? 0,
    students: users?.filter((user: any) => user.role === "student").length ?? 0,
    creators: users?.filter((user: any) => user.role === "creator").length ?? 0,
  }), [users]);
  const hasFilters = Boolean(search) || role !== "all";
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">All Users</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Manage all accounts across the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total users", value: counts.total },
          { label: "Students", value: counts.students },
          { label: "Creators", value: counts.creators },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E5E5E5] bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-[#69737D]">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search users</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8490]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or ID…"
            className="h-11 w-full rounded-lg border border-[#D9DEE5] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
          className="h-11 rounded-lg border border-[#D9DEE5] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-44"
          aria-label="Filter users by role"
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="creator">Creators</option>
          <option value="admin">Admin</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" className="h-11 gap-2 sm:px-3" onClick={() => { setSearch(""); setRole("all"); }}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 text-sm text-[#69737D]">
            <span>{filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found</span>
            {hasFilters && <span>Filtered from {counts.total}</span>}
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
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
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{user.id}</td>
                  <td className="p-4 font-bold text-[14px] text-black">{user.name}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{user.email}</td>
                  <td className="p-4">
                    <Badge className="bg-gray-100 text-[#394649] hover:bg-gray-100 border-none shadow-none uppercase text-[10px] font-bold">{user.role}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {user.role !== "admin" && <CreatorRoleButton user={user} />}
                      {user.role !== "admin" && <EnrollmentManager user={user} />}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <p className="font-semibold text-black">No matching users</p>
                    <p className="mt-1 text-sm text-[#69737D]">Try another name, email, ID, or role.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatorRoleButton({ user }: { user: any }) {
  const mutation = useUpdateAdminUserCreatorRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const enabled = user.role !== "creator";
  return <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: user.id, data: { enabled } }, {
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: getAdminUsersQueryKey() }); toast({ title: enabled ? "Creator access granted" : "Creator access revoked" }); },
    onError: (error: any) => toast({ title: "Role update failed", description: error?.message ?? "Please try again.", variant: "destructive" }),
  })}>{enabled ? "Grant creator" : "Revoke creator"}</Button>;
}

function EnrollmentManager({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const { data: enrollments, isLoading } = useAdminUserEnrollments(user.id, { query: { enabled: open, queryKey: getAdminUserEnrollmentsQueryKey(user.id) } });
  const { data: courses } = useAdminCourses();
  const add = useAddAdminUserEnrollment();
  const remove = useRemoveAdminUserEnrollment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const enrolledIds = new Set((enrollments ?? []).map((item: any) => item.course?.id ?? item.enrollment?.courseId));
  const enroll = (courseId: number) => add.mutate({ id: user.id, data: { courseId } }, {
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: getAdminUserEnrollmentsQueryKey(user.id) }); toast({ title: "Student enrolled" }); },
    onError: (error: any) => toast({ title: "Enrollment failed", description: error?.message ?? "Please try again.", variant: "destructive" }),
  });
  const unenroll = (courseId: number) => remove.mutate({ id: user.id, courseId }, {
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: getAdminUserEnrollmentsQueryKey(user.id) }); toast({ title: "Enrollment removed" }); },
    onError: (error: any) => toast({ title: "Could not remove enrollment", description: error?.message ?? "Please try again.", variant: "destructive" }),
  });
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Manage learning</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Manage {user.name}'s learning</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <section><p className="text-sm font-bold mb-2">Current enrollments</p>{isLoading ? <p className="text-sm text-[#69737D]">Loading…</p> : enrollments?.length ? <div className="space-y-2">{enrollments.map((item: any) => { const course = item.course; const courseId = course?.id ?? item.enrollment?.courseId; return <div key={courseId} className="flex items-center justify-between gap-3 border rounded-lg p-3"><span className="text-sm">{course?.title ?? `Course #${courseId}`}</span><Button size="sm" variant="outline" disabled={remove.isPending} onClick={() => unenroll(courseId)}>Remove</Button></div>; })}</div> : <p className="text-sm text-[#69737D]">No courses assigned yet.</p>}</section>
          <section><p className="text-sm font-bold mb-2">Add course</p><div className="flex gap-2"><select className="flex-1 h-10 rounded-lg border px-3 text-sm" defaultValue="" onChange={(event) => { const id = Number(event.target.value); if (id && !enrolledIds.has(id)) enroll(id); }}><option value="" disabled>Select a course…</option>{(courses ?? []).filter((course: any) => !enrolledIds.has(course.id)).map((course: any) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div></section>
        </div>
      </DialogContent>
    </Dialog>
  </>;
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left">
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
        </div>
      )}
    </div>
  );
}
