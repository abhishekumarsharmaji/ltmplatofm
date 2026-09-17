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
import { PublishProductButton } from "@/components/dashboard/PublishProductButton";
import { CourseBuilder } from "./creator/CourseBuilder";

export default function CreatorDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const id = params.id;
  const action = params.action;
  
  if (section === "courses" && id && action === "builder") {
    return <CourseBuilder productId={Number(id)} />;
  }

  return (
    <DashboardLayout role="creator">
      {section === "overview" && <Overview />}
      {section === "courses" && !id && <Courses />}
      {section === "products" && <Products />}
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
    }, {
      onSuccess: (prod) => {
        setLocation(`/dashboard/creator/courses/${prod.id}/builder`);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creator Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back, {session?.user?.name || "Creator"}. Here's what's happening.</p>
        </div>
        <div className="flex gap-2">
          <ProductFormDialog type="digital">
            <Button variant="outline">
              New Product
            </Button>
          </ProductFormDialog>
          <Button onClick={handleCreateCourse} disabled={createProduct.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: salesLoading ? "..." : `$${((sales?.grossMinor || 0) / 100).toFixed(2)}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Orders", value: salesLoading ? "..." : (sales?.orderCount || 0).toString(), icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active Courses", value: productsLoading ? "..." : courseCount.toString(), icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Products", value: productsLoading ? "..." : (products?.length || 0).toString(), icon: Package, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
            <h4 className="text-2xl font-bold">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <Link href="/dashboard/creator/sales">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {salesLoading ? (
              <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
            ) : !sales?.orders || sales.orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No orders yet.</p>
            ) : (
              sales.orders.slice(0, 5).map((order: any, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-muted-foreground">
                      {order.userName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.userName}</p>
                      <p className="text-xs text-muted-foreground">{order.productName}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">+${((order.amountMinor || 0) / 100).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/creator/courses">
              <Button variant="outline" className="w-full justify-start h-12 mb-3">
                <BookOpen className="w-4 h-4 mr-3 text-muted-foreground" />
                Manage Courses
              </Button>
            </Link>
            <Link href="/dashboard/creator/products">
              <Button variant="outline" className="w-full justify-start h-12 mb-3">
                <Package className="w-4 h-4 mr-3 text-muted-foreground" />
                Manage Products
              </Button>
            </Link>
            <Link href="/dashboard/creator/sales">
              <Button variant="outline" className="w-full justify-start h-12">
                <DollarSign className="w-4 h-4 mr-3 text-muted-foreground" />
                View Payouts
              </Button>
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
    }, {
      onSuccess: (prod) => {
        setLocation(`/dashboard/creator/courses/${prod.id}/builder`);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground mt-1">Manage your educational content.</p>
        </div>
        <Button onClick={handleCreateCourse} disabled={createProduct.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !courses || courses.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
          <Button onClick={handleCreateCourse} disabled={createProduct.isPending}>Create Your First Course</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
             <div key={course.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm group">
                <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-bold line-clamp-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">${(course.priceMinor / 100).toFixed(2)}</p>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <Badge variant="secondary" className={course.status === 'published' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                    {course.status}
                  </Badge>
                  <Link href={`/dashboard/creator/courses/${course.id}/builder`}>
                    <Button size="sm" variant="outline">Edit Course</Button>
                  </Link>
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Digital Products</h2>
          <p className="text-muted-foreground mt-1">Manage your downloadable content.</p>
        </div>
        <ProductFormDialog type="digital">
          <Button>
            Add Product
          </Button>
        </ProductFormDialog>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">You haven't added any digital products yet.</p>
          <ProductFormDialog type="digital">
            <Button>Add Your First Product</Button>
          </ProductFormDialog>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Title</th>
                <th className="p-4 font-medium text-muted-foreground">Type</th>
                <th className="p-4 font-medium text-muted-foreground">Price</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-4 font-medium">{item.title}</td>
                  <td className="p-4"><Badge variant="outline" className="uppercase text-[10px]">{item.type}</Badge></td>
                  <td className="p-4 font-medium">${(item.priceMinor / 100).toFixed(2)} {item.currency}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className={item.status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <ProductFormDialog type="digital" product={item}>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </ProductFormDialog>
                    <PublishProductButton id={item.id} status={item.status} />
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

function Sales() {
  const { data: sales, isLoading } = useCreatorSalesSummary();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sales & Analytics</h2>
        <p className="text-muted-foreground mt-1">Track your revenue and performance.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !sales ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No data available</h3>
          <p className="text-muted-foreground">Sales data will appear here once you start generating revenue.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center">
              <p className="text-muted-foreground font-medium mb-2">Total Revenue</p>
              <h3 className="text-4xl font-bold text-emerald-500">${((sales.grossMinor || 0) / 100).toFixed(2)}</h3>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center">
              <p className="text-muted-foreground font-medium mb-2">Total Orders</p>
              <h3 className="text-4xl font-bold text-blue-500">{sales.orderCount || 0}</h3>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center">
              <p className="text-muted-foreground font-medium mb-2">Avg. Order Value</p>
              <h3 className="text-4xl font-bold text-purple-500">
                ${sales.orderCount ? ((sales.grossMinor || 0) / 100 / sales.orderCount).toFixed(2) : "0.00"}
              </h3>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mt-8 mb-4">Transaction History</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4 font-medium text-muted-foreground">Date</th>
                  <th className="p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="p-4 font-medium text-muted-foreground">Product</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.orders && sales.orders.length > 0 ? (
                  sales.orders.map((order: any, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-4 text-sm text-muted-foreground">{order.createdAt ? new Date(String(order.createdAt)).toLocaleDateString() : '-'}</td>
                      <td className="p-4 font-medium">{order.userName}</td>
                      <td className="p-4 text-sm text-muted-foreground">{order.productName}</td>
                      <td className="p-4 font-bold text-right text-emerald-500">+${((order.amountMinor || 0) / 100).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
