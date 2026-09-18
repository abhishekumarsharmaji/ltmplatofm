import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useParams, Link } from "wouter";
import { 
  useStudentLibrary, 
  usePurchasedProducts, 
  useStudentOrders, 
  useListWishlist,
  useGetSession,
  useMarketplaceCourses
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { BookOpen, Package, ShoppingCart, Heart, Play, Trophy, CheckCircle2, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UpgradeCreatorButton } from "@/components/auth/UpgradeCreatorButton";
import { StudentLiveClasses } from "@/components/dashboard/StudentLiveClasses";
import { LiveClassroom } from "@/components/dashboard/LiveClassroom";
import { StudentCoursePlayer } from "@/components/dashboard/StudentCoursePlayer";

export default function StudentDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const id = params.id;
  const action = params.action;
  const { data: session } = useGetSession();

  if (section === "live-classes" && id && action === "classroom") {
    return (
      <DashboardLayout role="student">
        <LiveClassroom id={Number(id)} backUrl="/dashboard/student/live-classes" />
      </DashboardLayout>
    );
  }
  if (section === "courses" && id) {
    return (
      <DashboardLayout role="student">
        <StudentCoursePlayer courseId={Number(id)} />
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout role="student">
      {section === "overview" && <Overview name={session?.user?.name || "Student"} />}
      {section === "library" && <Library />}
      {section === "products" && <Products />}
      {section === "live-classes" && !id && <StudentLiveClasses />}
      {section === "orders" && <Orders />}
      {section === "wishlist" && <Wishlist />}
    </DashboardLayout>
  );
}

function Overview({ name }: { name: string }) {
  const { data: library } = useStudentLibrary();
  const { data: products } = usePurchasedProducts();
  const { data: availableCourses, isLoading: coursesLoading } = useMarketplaceCourses({});

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

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Available Courses</h3>
            <p className="text-sm text-muted-foreground">New courses published by our creators.</p>
          </div>
          <Link href="/courses">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />)}
          </div>
        ) : !availableCourses?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium">No published courses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Creator courses will appear here after publishing.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableCourses.slice(0, 6).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md">
                  <div className="relative flex aspect-video items-center justify-center bg-muted overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <BookOpen className="h-12 w-12 text-muted-foreground/30 transition-transform duration-500 group-hover:scale-110" />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-success text-success-foreground font-bold shadow-sm">
                        Free
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 font-bold group-hover:text-primary transition-colors">{course.title}</h4>
                      <Badge variant="secondary" className="shrink-0 capitalize">{course.level || "Beginner"}</Badge>
                    </div>
                    {course.creatorName && (
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        by {course.creatorName}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.lessons} lesson{course.lessons === 1 ? "" : "s"}
                      </span>
                      <span className="text-primary font-bold">Start</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
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
          {library.map((item: any, i) => {
             const course = item.course || item;
             return (
               <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/50 transition-colors flex flex-col">
                  <div className="relative aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Play className="w-10 h-10 text-muted-foreground/30 transition-transform duration-500 group-hover:scale-110" />
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play className="w-12 h-12 text-white fill-white drop-shadow-md" />
                    </div>
                  </div>
                  <h3 className="font-bold line-clamp-1 mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                  {course.creatorName && (
                    <p className="text-xs text-muted-foreground mb-4">by {course.creatorName}</p>
                  )}
                  <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Enrolled</Badge>
                     <Link href={`/dashboard/student/courses/${course.id}`}><Button size="sm">Continue Learning</Button></Link>
                  </div>
               </div>
             );
          })}
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
