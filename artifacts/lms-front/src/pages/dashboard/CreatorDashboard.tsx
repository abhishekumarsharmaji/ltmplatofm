import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useParams, Link, useLocation } from "wouter";
import { 
  useCreatorSalesSummary,
  useListCreatorProducts,
  useGetSession,
  useCreateCreatorProduct,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BookOpen, Package, DollarSign, Users, TrendingUp, BarChart3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/dashboard/ProductFormDialog";
import { CourseBuilder } from "./creator/CourseBuilder";
import { CreatorLiveClassesStandalone } from "@/components/dashboard/LiveClassesStandalone";
import { LiveClassroom } from "@/components/dashboard/LiveClassroom";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";
import { CreatorProductManage } from "@/components/dashboard/digital-products/CreatorProductManage";

export default function CreatorDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const id = params.id;
  const action = params.action;
  
  if (section === "courses" && id && action === "builder") {
    return <CourseBuilder productId={Number(id)} />;
  }

  if (section === "products" && id && action === "manage") {
    return (
      <DashboardLayout role="creator">
        <CreatorProductManage productId={Number(id)} />
      </DashboardLayout>
    );
  }

  if (section === "live-classes" && id && action === "classroom") {
    return (
      <DashboardLayout role="creator">
        <LiveClassroom id={Number(id)} backUrl="/dashboard/creator/courses" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="creator">
      {section === "overview" && <Overview />}
      {section === "courses" && !id && <Courses />}
      {section === "products" && !id && <Products />}
      {section === "live-classes" && !id && <CreatorLiveClassesStandalone />}
      {section === "sales" && <Sales />}
    </DashboardLayout>
  );
}

function Overview() {
  const { data: session } = useGetSession();
  const { data: sales, isLoading: salesLoading } = useCreatorSalesSummary();
  const { data: products, isLoading: productsLoading } = useListCreatorProducts();
  const createProduct = useCreateCreatorProduct();
  const [_, setLocation] = useLocation();
  
  const courseCount = products?.filter(p => p.type === 'course').length || 0;

  const handleCreateCourse = () => {
    createProduct.mutate({
      data: {
        title: "Untitled Course",
        type: "course",
        priceMinor: 0,
        currency: "usd"
      }
    } as any, {
      onSuccess: (prod) => {
        setLocation(`/dashboard/creator/courses/${prod.id}/builder`);
      }
    });
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Creator Dashboard</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Welcome back, {session?.user?.name || "Creator"}. Here's what's happening.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <ProductFormDialog type="digital">
            <Button className="w-full border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-11 px-6 rounded-md font-medium text-[14px] sm:w-auto">
              New Product
            </Button>
          </ProductFormDialog>
          <Button onClick={handleCreateCourse} disabled={createProduct.isPending} className="h-11 w-full px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)] sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: salesLoading ? "..." : `$${((sales?.grossMinor || 0) / 100).toFixed(2)}`, icon: DollarSign, color: "text-[#15CF74]", bg: "bg-[#E3F9EF]" },
          { label: "Total Orders", value: salesLoading ? "..." : (sales?.orderCount || 0).toString(), icon: Package, color: "text-[#224EA1]", bg: "bg-[#EAEFF8]" },
          { label: "Active Courses", value: productsLoading ? "..." : courseCount.toString(), icon: BookOpen, color: "text-[#704FE6]", bg: "bg-[#F1EEFC]" },
          { label: "Products", value: productsLoading ? "..." : (products?.length || 0).toString(), icon: Package, color: "text-[#FE543D]", bg: "bg-[#FFEFEB]" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#E5E5E5] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-[14px] text-[#4D4D4D] font-medium mb-1">{stat.label}</p>
            <h4 className="text-[28px] font-bold text-black">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[20px] font-bold text-black">Recent Orders</h3>
            <Link href="/dashboard/creator/sales" className="text-primary hover:bg-[#E3F9EF] hover:text-primary h-10 px-4 py-2 inline-flex items-center justify-center rounded-md font-medium">View All</Link>
          </div>
          
          <div className="space-y-2">
            {salesLoading ? (
              <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
            ) : !sales?.orders || sales.orders.length === 0 ? (
              <p className="text-[#9794AA] text-center py-10">No orders yet.</p>
            ) : (
              sales.orders.slice(0, 5).map((order: any, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-[#E5E5E5]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FAFAFA] border border-[#E5E5E5] rounded-full flex items-center justify-center font-bold text-[#394649]">
                      {order.userName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-black">{order.userName}</p>
                      <p className="text-[13px] text-[#4D4D4D]">{order.productName}</p>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-primary">+${((order.amountMinor || 0) / 100).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-[#515151] rounded-xl p-8 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-[20px] font-bold text-white mb-8">Quick Actions</h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <Link href="/dashboard/creator/courses" className="w-full justify-start h-14 bg-white/10 hover:bg-white/20 text-white border-none rounded-lg text-[15px] transition-colors inline-flex items-center px-4">
                <BookOpen className="w-5 h-5 mr-4" />
                Manage Courses
            </Link>
            <Link href="/dashboard/creator/products" className="w-full justify-start h-14 bg-white/10 hover:bg-white/20 text-white border-none rounded-lg text-[15px] transition-colors inline-flex items-center px-4">
                <Package className="w-5 h-5 mr-4" />
                Manage Products
            </Link>
            <Link href="/dashboard/creator/sales" className="w-full justify-start h-14 bg-white/10 hover:bg-white/20 text-white border-none rounded-lg text-[15px] transition-colors inline-flex items-center px-4">
                <DollarSign className="w-5 h-5 mr-4" />
                View Payouts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Courses() {
  const { data: allProducts, isLoading } = useListCreatorProducts();
  const createProduct = useCreateCreatorProduct();
  const [_, setLocation] = useLocation();
  const courses = allProducts?.filter(p => p.type === 'course');
  
  const handleCreateCourse = () => {
    createProduct.mutate({
      data: {
        title: "Untitled Course",
        type: "course",
        priceMinor: 0,
        currency: "usd"
      }
    } as any, {
      onSuccess: (prod) => {
        setLocation(`/dashboard/creator/courses/${prod.id}/builder`);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Courses</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Manage your educational content.</p>
        </div>
        <Button onClick={handleCreateCourse} disabled={createProduct.isPending} className="h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !courses || courses.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
          <BookOpen className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No courses found</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-6">You haven't created any courses yet.</p>
          <Button onClick={handleCreateCourse} disabled={createProduct.isPending} className="h-[44px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px]">Create Your First Course</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course: any) => (
             <div key={course.id} className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-sm group hover:shadow-md transition-shadow">
                 <div className="aspect-[16/10] bg-gradient-to-br from-green-50 to-blue-50 rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
                   <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="transition-transform duration-500 group-hover:scale-105" />
                </div>
                <h3 className="font-bold text-[16px] text-black line-clamp-1">{course.title}</h3>
                <p className="text-[14px] text-primary font-bold mt-1">Free</p>
                <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex justify-between items-center">
                  <Badge className={course.status === 'published' ? 'bg-[#E3F9EF] text-primary hover:bg-[#E3F9EF] border-none shadow-none font-medium' : 'bg-gray-100 text-[#9794AA] hover:bg-gray-100 border-none shadow-none font-medium'}>
                    {course.status}
                  </Badge>
                  <Link href={`/dashboard/creator/courses/${course.id}/builder`} className="h-[36px] px-4 border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 rounded-md text-[13px] font-medium inline-flex items-center justify-center">Edit Course</Link>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Products() {
  const { data: allProducts, isLoading } = useListCreatorProducts();
  const products = allProducts?.filter(p => p.type === 'digital');
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Digital Products</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Manage your downloadable free content.</p>
        </div>
        <ProductFormDialog type="digital">
          <Button className="h-11 px-6 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </ProductFormDialog>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
          <Package className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No products found</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-6">You haven't added any digital products yet.</p>
          <ProductFormDialog type="digital">
            <Button className="h-[44px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px]">Add Your First Product</Button>
          </ProductFormDialog>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                <tr>
                  <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Title</th>
                  <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Subtype</th>
                  <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {products.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-[14px] text-black">{item.title}</td>
                    <td className="p-4"><Badge className="bg-gray-100 text-[#4D4D4D] hover:bg-gray-100 border-none shadow-none uppercase text-[10px] font-bold">{item.subtype || item.type}</Badge></td>
                    <td className="p-4">
                      <Badge className={item.status === 'published' ? 'bg-[#E3F9EF] text-primary hover:bg-[#E3F9EF] border-none shadow-none font-medium' : 'bg-gray-100 text-[#9794AA] hover:bg-gray-100 border-none shadow-none font-medium'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/creator/products/${item.id}/manage`} className="h-[36px] px-4 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[13px] inline-flex items-center justify-center">Manage</Link>
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

function Sales() {
  const { data: sales, isLoading } = useCreatorSalesSummary();
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Sales & Analytics</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Track your revenue and performance.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !sales ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl shadow-sm">
          <BarChart3 className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No data available</h3>
          <p className="text-[14px] text-[#4D4D4D]">Sales data will appear here once you start generating revenue.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#515151] border-none p-8 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-white text-[16px] font-bold mb-2">Total Revenue</p>
              <h3 className="text-[40px] font-bold text-primary leading-none">${((sales.grossMinor || 0) / 100).toFixed(2)}</h3>
            </div>
            <div className="bg-white border border-[#E5E5E5] p-8 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[#394649] text-[16px] font-bold mb-2">Total Orders</p>
              <h3 className="text-[40px] font-bold text-black leading-none">{sales.orderCount || 0}</h3>
            </div>
            <div className="bg-white border border-[#E5E5E5] p-8 rounded-xl shadow-sm flex flex-col justify-center">
              <p className="text-[#394649] text-[16px] font-bold mb-2">Avg. Order Value</p>
              <h3 className="text-[40px] font-bold text-black leading-none">
                ${sales.orderCount ? ((sales.grossMinor || 0) / 100 / sales.orderCount).toFixed(2) : "0.00"}
              </h3>
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="text-[24px] font-bold text-black mb-6">Transaction History</h3>
            <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Date</th>
                      <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Customer</th>
                      <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Product</th>
                      <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {sales.orders && sales.orders.length > 0 ? (
                      sales.orders.map((order: any, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-[14px] text-[#4D4D4D]">{order.createdAt ? new Date(String(order.createdAt)).toLocaleDateString() : '-'}</td>
                          <td className="p-4 font-bold text-[14px]">{order.userName}</td>
                          <td className="p-4 text-[14px] text-[#4D4D4D]">{order.productName}</td>
                          <td className="p-4 font-bold text-[14px] text-right text-primary">+${((order.amountMinor || 0) / 100).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#9794AA]">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
