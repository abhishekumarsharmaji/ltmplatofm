import { lazy, Suspense } from "react";
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
import { AlertCircle, BookOpen, Package, ShoppingCart, Heart, Play, Trophy, CheckCircle2, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UpgradeCreatorButton } from "@/components/auth/UpgradeCreatorButton";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";

const StudentLiveClasses = lazy(() => import("@/components/dashboard/StudentLiveClasses").then((module) => ({ default: module.StudentLiveClasses })));
const LiveClassroom = lazy(() => import("@/components/dashboard/LiveClassroom").then((module) => ({ default: module.LiveClassroom })));
const StudentCoursePlayer = lazy(() => import("@/components/dashboard/StudentCoursePlayer").then((module) => ({ default: module.StudentCoursePlayer })));

function SectionLoading() {
  return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
}

export default function StudentDashboard() {
  const params = useParams();
  const section = params.section || "overview";
  const id = params.id;
  const action = params.action;
  const { data: session } = useGetSession();

  if (section === "live-classes" && id && action === "classroom") {
    return (
      <DashboardLayout role="student">
        <Suspense fallback={<SectionLoading />}>
          <LiveClassroom id={Number(id)} backUrl="/dashboard/student/live-classes" />
        </Suspense>
      </DashboardLayout>
    );
  }
  if (section === "courses" && id) {
    return (
      <DashboardLayout role="student">
        <Suspense fallback={<SectionLoading />}>
          <StudentCoursePlayer courseId={Number(id)} />
        </Suspense>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout role="student">
      {section === "overview" && <Overview name={session?.user?.name || "Student"} />}
      {section === "library" && <Library />}
      {section === "products" && <Products />}
      {section === "live-classes" && !id && <Suspense fallback={<SectionLoading />}><StudentLiveClasses /></Suspense>}
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
    <div className="space-y-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Welcome back, {name.split(' ')[0]}!</h2>
          <p className="text-[16px] text-[#4D4D4D] mt-1">Ready to learn something new today?</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#515151] rounded-xl p-8 flex flex-col justify-center shadow-sm">
          <h3 className="text-white text-[18px] font-bold mb-6">Learning Stats</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 text-white rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-medium">Courses Enrolled</p>
                  <p className="text-[#A3A3A3] text-[13px]">All time</p>
                </div>
              </div>
              <span className="text-primary text-[32px] font-bold">{library?.length ?? "--"}</span>
            </div>
            <div className="flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 text-white rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-medium">Products Purchased</p>
                  <p className="text-[#A3A3A3] text-[13px]">All time</p>
                </div>
              </div>
              <span className="text-primary text-[32px] font-bold">{products?.length ?? "--"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm flex items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-10 -top-10 bg-[#E3F9EF] w-40 h-40 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <Trophy className="w-14 h-14 text-primary mx-auto mb-5" />
            <h3 className="font-bold text-[24px] text-black mb-3">Ready to share your knowledge?</h3>
            <p className="text-[14px] text-[#4D4D4D] mb-6 max-w-sm mx-auto leading-relaxed">Upgrade your account to become a creator. Start building courses and digital products today.</p>
            <UpgradeCreatorButton />
          </div>
        </div>
      </div>

      <section className="space-y-8 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[28px] font-bold text-black tracking-tight">Available Courses</h3>
            <p className="text-[14px] text-[#4D4D4D]">New courses published by our creators.</p>
          </div>
          <Link href="/courses">
            <Button variant="outline" className="border-[#DADADA] text-[#394649] hover:bg-gray-50 h-10 px-6 rounded-md font-medium">View All</Button>
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[320px] animate-pulse rounded-lg border border-[#E5E5E5] bg-white">
                <div className="h-[180px] bg-gray-200 rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 w-3/4 rounded" />
                  <div className="h-4 bg-gray-200 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !availableCourses?.length ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-[#9794AA]" />
            <p className="font-bold text-[18px] text-black">No published courses yet</p>
            <p className="mt-2 text-[14px] text-[#4D4D4D]">Creator courses will appear here after publishing.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableCourses.slice(0, 6).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className="group rounded-lg border border-[#E5E5E5] bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer overflow-hidden">
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-white hover:bg-primary font-bold shadow-sm rounded-full px-3 py-1 text-[12px]">
                        Free
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-center text-[13px] text-[#394649] mb-3">
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.lessons || 0} lessons</span>
                      <span className="capitalize">{course.level || "Beginner"}</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-black leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between text-[13px] text-[#394649]">
                      <span>{course.creatorName || "Unknown Author"}</span>
                    </div>
                  </div>
                </div>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">My Learning</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Courses you are currently enrolled in.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !library || library.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl">
          <BookOpen className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No courses yet</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-6">You haven't enrolled in any courses.</p>
          <Link href="/courses">
            <Button className="h-[44px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">Explore Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.map((item: any, i) => {
             const course = item.course || item;
             return (
               <div key={i} className="group rounded-lg border border-[#E5E5E5] bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col h-full overflow-hidden">
                  <div className="relative aspect-[16/10] bg-gray-100 flex items-center justify-center overflow-hidden">
                     <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play className="w-12 h-12 text-white fill-white drop-shadow-md" />
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-center text-[13px] text-[#394649] mb-3">
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.lessons || 0} lessons</span>
                      <span className="capitalize">{course.level || "Beginner"}</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-black leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[13px] text-[#394649]">{course.creatorName || "Unknown Author"}</span>
                      <Link href={`/dashboard/student/courses/${course.id}`}>
                        <Button className="h-[36px] px-4 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[13px]">Continue</Button>
                      </Link>
                    </div>
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
  const { data: products, isLoading, isError, isFetching, refetch } = usePurchasedProducts();
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Purchased Products</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Digital products you have access to.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 py-16 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h3 className="mb-2 text-[18px] font-bold text-black">Products couldn't load</h3>
          <p className="mb-6 text-[14px] text-[#4D4D4D]">The server took too long to respond. Please try again.</p>
          <Button onClick={() => refetch()} disabled={isFetching} className="h-11 bg-primary px-7 text-white hover:bg-[#10A364]">
            {isFetching ? "Trying again..." : "Retry"}
          </Button>
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl">
          <Package className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No products yet</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-6">You haven't purchased any digital products.</p>
          <Link href="/products">
            <Button className="h-[44px] px-8 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[14px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item: any, i) => (
             <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-blue-50 rounded-md mb-4 flex items-center justify-center">
                  <Package className="w-10 h-10 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                </div>
                 <h3 className="font-bold text-[16px] text-black leading-snug line-clamp-2">{item.product?.title ?? item.title}</h3>
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                   <Link href={`/products/${item.product?.id ?? item.productId ?? item.id}`}>
                     <Button className="w-full border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-10 rounded-md font-medium text-[14px]">Download Access</Button>
                   </Link>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Order History</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">View your past transactions and receipts.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl">
          <ShoppingCart className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">No orders</h3>
          <p className="text-[14px] text-[#4D4D4D]">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Date</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider">Status</th>
                <th className="p-4 text-[13px] font-bold text-[#394649] uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {orders.map((item: any, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-[14px] text-[#4D4D4D]">{item.id}</td>
                  <td className="p-4 text-[14px] text-[#4D4D4D]">{item.date ? new Date(String(item.date)).toLocaleDateString() : '-'}</td>
                  <td className="p-4 text-[14px]">
                    <Badge className="bg-[#E3F9EF] text-primary hover:bg-[#E3F9EF] font-medium border-none shadow-none">{item.status}</Badge>
                  </td>
                  <td className="p-4 font-bold text-black text-right">${((item.totalMinor ?? 0) / 100).toFixed(2)}</td>
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
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-black tracking-tight leading-tight">Wishlist</h2>
        <p className="text-[16px] text-[#4D4D4D] mt-1">Saved items you want to purchase later.</p>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : !wishlist || wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E5E5] rounded-xl">
          <Heart className="w-12 h-12 text-[#9794AA] mx-auto mb-4" />
          <h3 className="font-bold text-[18px] text-black mb-2">Your wishlist is empty</h3>
          <p className="text-[14px] text-[#4D4D4D] mb-8 max-w-md mx-auto">Save items you're interested in by clicking the heart icon on any course or product.</p>
          <div className="flex justify-center gap-4">
            <Link href="/courses">
              <Button className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-11 px-8 rounded-md font-medium text-[16px]">Browse Courses</Button>
            </Link>
            <Link href="/products">
              <Button className="border border-[#DADADA] text-[#394649] bg-white hover:bg-gray-50 h-11 px-8 rounded-md font-medium text-[16px]">Browse Products</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item: any, i) => (
             <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-sm group">
                <div className="aspect-[16/10] bg-gradient-to-br from-green-50 to-blue-50 rounded-md mb-4 flex items-center justify-center">
                  <Star className="w-10 h-10 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-bold text-[16px] text-black leading-snug line-clamp-1 mb-2 group-hover:text-primary transition-colors">{item.product?.title ?? item.title ?? "Saved Item"}</h3>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#E5E5E5]">
                  <span className="font-bold text-[18px] text-black">${((item.product?.priceMinor ?? item.priceMinor ?? 0) / 100).toFixed(2)}</span>
                  <Link href="/checkout">
                    <Button className="h-[36px] px-5 bg-primary hover:bg-[#10A364] text-white font-medium rounded-md text-[13px] shadow-[0_4px_14px_rgba(21,207,116,0.25)]">Add to Cart</Button>
                  </Link>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
