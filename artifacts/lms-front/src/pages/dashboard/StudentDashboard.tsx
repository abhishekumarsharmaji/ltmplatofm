import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useParams, Link } from "wouter";
import { 
  useStudentLibrary, 
  usePurchasedProducts, 
  useStudentOrders, 
  useListWishlist,
  useGetSession
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BookOpen, Package, ShoppingCart, Heart, Play, Trophy, CheckCircle2, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UpgradeCreatorButton } from "@/components/auth/UpgradeCreatorButton";

export default function StudentDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const { data: session } = useGetSession();
  
  return (
    <DashboardLayout role="student">
      {section === "overview" && <Overview name={session?.user?.name || "Student"} />}
      {section === "library" && <Library />}
      {section === "products" && <Products />}
      {section === "orders" && <Orders />}
      {section === "wishlist" && <Wishlist />}
    </DashboardLayout>
  );
}

function Overview({ name }: { name: string }) {
  const { data: library } = useStudentLibrary();
  const { data: products } = usePurchasedProducts();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {name.split(' ')[0]}!</h2>
          <p className="text-muted-foreground mt-1">Ready to learn something new today?</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Learning Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Courses Enrolled</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
              </div>
              <span className="text-xl font-bold">{library?.length ?? "--"}</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Products Purchased</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
              </div>
              <span className="text-xl font-bold">{products?.length ?? "--"}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 bg-primary/5 w-40 h-40 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-bold mb-2">Ready to share your knowledge?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">Upgrade your account to become a creator. Start building courses and digital products today.</p>
            <UpgradeCreatorButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function Library() {
  const { data: library, isLoading } = useStudentLibrary();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Learning</h2>
        <p className="text-muted-foreground mt-1">Courses you are currently enrolled in.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !library || library.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">You haven't enrolled in any courses.</p>
          <Link href="/courses"><Button>Explore Courses</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.map((item: any, i) => (
             <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center">
                  <Play className="w-10 h-10 text-muted-foreground/30" />
                </div>
                   <h3 className="font-bold line-clamp-1">{item.course?.title ?? item.title}</h3>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <Badge variant="secondary">In Progress</Badge>
                   <Link href={`/courses/${item.course?.id ?? item.courseId ?? item.id}`}><Button size="sm">Resume</Button></Link>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Products() {
  const { data: products, isLoading } = usePurchasedProducts();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Purchased Products</h2>
        <p className="text-muted-foreground mt-1">Digital products you have access to.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">You haven't purchased any digital products.</p>
          <Link href="/products"><Button>Explore Products</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item: any, i) => (
             <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="aspect-square bg-muted rounded-xl mb-4 flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground/30" />
                </div>
                 <h3 className="font-bold line-clamp-2">{item.product?.title ?? item.title}</h3>
                <div className="mt-auto pt-4 border-t border-border">
                   <Link href={`/products/${item.product?.id ?? item.productId ?? item.id}`}><Button size="sm" variant="outline" className="w-full">Download Access</Button></Link>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Orders() {
  const { data: orders, isLoading } = useStudentOrders();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Order History</h2>
        <p className="text-muted-foreground mt-1">View your past transactions and receipts.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No orders</h3>
          <p className="text-muted-foreground">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Order ID</th>
                <th className="p-4 font-medium text-muted-foreground">Date</th>
                <th className="p-4 font-medium text-muted-foreground">Items</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((item: any, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-4 font-mono text-sm">{item.id}</td>
                   <td className="p-4 text-sm text-muted-foreground">{item.date ? new Date(String(item.date)).toLocaleDateString() : '-'}</td>
                   <td className="p-4 font-medium">{item.status}</td>
                   <td className="p-4 font-bold text-right">${((item.totalMinor ?? 0) / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Wishlist() {
  const { data: wishlist, isLoading } = useListWishlist();
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Wishlist</h2>
        <p className="text-muted-foreground mt-1">Saved items you want to purchase later.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !wishlist || wishlist.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-4">Save items you're interested in by clicking the heart icon on any course or product.</p>
          <div className="flex justify-center gap-4">
            <Link href="/courses"><Button variant="outline">Browse Courses</Button></Link>
            <Link href="/products"><Button variant="outline">Browse Products</Button></Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item: any, i) => (
             <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center">
                  <Star className="w-10 h-10 text-muted-foreground/30" />
                </div>
                 <h3 className="font-bold line-clamp-1 mb-2">{item.product?.title ?? item.title ?? "Saved Item"}</h3>
                <div className="flex justify-between items-center">
                   <span className="font-bold text-primary">${((item.product?.priceMinor ?? item.priceMinor ?? 0) / 100).toFixed(2)}</span>
                  <Link href="/checkout"><Button size="sm">Add to Cart</Button></Link>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
