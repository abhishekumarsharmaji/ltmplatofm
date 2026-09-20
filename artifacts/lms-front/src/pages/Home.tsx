import { Link } from "wouter";
import { 
  CheckCircle2, 
  FileText, 
  Headphones, 
  ShieldCheck, 
  PlaySquare, 
  FileArchive, 
  Video,
  ArrowRight,
  Package,
  BookOpen
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListDigitalProducts, useMarketplaceCourses } from "@workspace/api-client-react";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";

function productPrice(priceMinor: number, currency: string) {
  if (priceMinor === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(priceMinor / 100);
}

export default function Home() {
  const { data: products } = useListDigitalProducts();
  const { data: courses } = useMarketplaceCourses();
  const courseCategories = Array.from(new Set((courses || []).map((course) => course.categoryName || "Other")));

  return (
    <PublicLayout>
      <main className="min-h-screen bg-white overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-b from-[#F4F9F6] to-white border border-[#E2EBE6] rounded-[2.5rem] p-8 sm:p-12 md:p-16 lg:p-20 relative overflow-hidden shadow-sm">
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] pointer-events-none animate-fade-in" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none animate-fade-in delay-200" />
            
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
              <div className="max-w-2xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 text-primary text-sm font-medium mb-8 shadow-sm animate-fade-in-up">
                   <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Now accepting creator applications
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold tracking-tight text-slate-900 leading-[1.05] mb-6 animate-fade-in-up delay-100">
                  The professional <span className="text-gradient">platform</span> for digital knowledge.
                </h1>
                
                <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed animate-fade-in-up delay-200">
                  CoreSkils provides the infrastructure for experts to publish practical courses, downloadable files, and live learning experiences. No technical headache. Just your expertise, organized and delivered.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
                  <Link href="/creator-application" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#0F1C16] px-8 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 group">
                    Start as a Creator <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/products" className="inline-flex h-14 items-center justify-center rounded-xl bg-white border border-slate-200 px-8 font-semibold text-slate-900 transition-all hover:bg-slate-50 hover:shadow-sm">
                    Explore Products
                  </Link>
                </div>
                
                <div className="mt-12 pt-8 border-t border-slate-200/60 flex flex-wrap gap-x-6 gap-y-3 items-center animate-fade-in-up delay-400">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Supports</span>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700 items-center">
                     <span className="flex items-center gap-1.5"><PlaySquare className="w-4 h-4 text-primary" /> Video Courses</span>
                     <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                     <span className="flex items-center gap-1.5"><FileArchive className="w-4 h-4 text-primary" /> Digital Toolkits</span>
                     <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                     <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-primary" /> Live Classes</span>
                  </div>
                </div>
              </div>
              
              <div className="relative lg:h-[500px] flex items-center justify-center animate-slide-in-right delay-300">
                 <img 
                   src={`${import.meta.env.BASE_URL}images/hero-abstract.png`}
                   alt="CoreSkils platform abstract" 
                   className="w-full h-auto object-cover rounded-2xl shadow-2xl ring-1 ring-black/5" 
                   fetchPriority="high" 
                 />
                 
                 {/* Floating elements for depth */}
                 <div className="absolute -left-6 top-10 glass-panel rounded-xl p-4 shadow-lg animate-fade-in-up delay-500 hidden md:block">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                       <CheckCircle2 className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                        <div className="text-sm font-bold text-slate-900">One Workspace</div>
                        <div className="text-xs text-slate-500">Create and deliver</div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY WE EXIST SECTION */}
        <section className="py-24 bg-white relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary mb-6 animate-fade-in-up">Why CoreSkils Exists</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-slate-900 leading-tight mb-8 animate-fade-in-up delay-100">
              Every expert, teacher, and creator has unique knowledge, hard-won insights, and transformative experiences.
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto animate-fade-in-up delay-200">
              The greatest risk isn't creating something meaningful. It's allowing valuable insights to stay unheard and never reach those who need them most. We provide the <span className="font-semibold text-slate-900 bg-primary/10 px-2 py-0.5 rounded">professional infrastructure</span> to turn your expertise into real impact.
            </p>
          </div>
        </section>

        {/* CAPABILITIES SECTION */}
        <section className="py-24 bg-[#F8FAF9] border-y border-[#E2EBE6]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary mb-4">One Platform, Endless Possibilities</p>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">Build your digital legacy.</h2>
                <p className="text-lg text-slate-600 mb-10">We handle the heavy lifting of hosting, access control, and delivery so you can focus on what you do best — sharing knowledge.</p>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <PlaySquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Publish Practical Courses</h3>
                      <p className="text-slate-600 leading-relaxed">Structure your knowledge into video lessons, documents, and resources with our intuitive course builder. Deliver high-quality learning experiences.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <FileArchive className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Publish Digital Toolkits</h3>
                      <p className="text-slate-600 leading-relaxed">Upload templates, guides, checklists, and ebooks with protected delivery, clear access durations, and controlled downloads.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Host Live Classes</h3>
                      <p className="text-slate-600 leading-relaxed">Schedule live sessions, teach inside the CoreSkils classroom, and organize course resources alongside every learning experience.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-[4/5] sm:aspect-square lg:aspect-auto lg:h-[700px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                  <img 
                    src={`${import.meta.env.BASE_URL}images/creator-workspace.png`}
                    alt="Professional creator workspace" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {courses && courses.length > 0 && (
          <section className="bg-[#F8FAF9] py-24 border-y border-[#E2EBE6]">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Published courses</p>
                  <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Learn by category</h2>
                </div>
                <Link href="/courses" className="inline-flex items-center gap-2 font-semibold text-[#087B46] hover:underline">View all courses <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="space-y-14">
                {courseCategories.map((categoryName) => (
                  <div key={categoryName}>
                    <div className="mb-5 flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="text-2xl font-bold text-slate-900">{categoryName}</h3>
                    </div>
                    <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                      {courses.filter((course) => (course.categoryName || "Other") === categoryName).slice(0, 3).map((course) => (
                        <article key={course.id} className="overflow-hidden rounded-2xl border border-[#DCE8E1] bg-white shadow-[0_14px_42px_rgba(20,80,55,.08)]">
                          <div className="aspect-[16/9] overflow-hidden bg-[#EEF5F1]">
                            <CourseThumbnail src={course.thumbnailUrl} title={course.title} />
                          </div>
                          <div className="p-6">
                            <span className="text-xs font-bold uppercase tracking-wide text-[#087B46]">{course.level || "Beginner"} · {course.lessons || 0} lessons</span>
                            <h4 className="mt-3 line-clamp-2 text-xl font-bold text-slate-900">{course.title}</h4>
                            <p className="mt-3 line-clamp-2 leading-6 text-slate-600">{course.description}</p>
                            <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#E4ECE8] pt-5">
                              <span className="text-xl font-bold text-slate-900">{productPrice(course.priceMinor || 0, course.currency || "INR")}</span>
                              <Link href={`/courses/${course.publicSlug || course.id}`} className="font-semibold text-[#087B46] hover:underline">View course</Link>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {products && products.length > 0 && (
          <section className="bg-white py-24">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Published catalogue</p>
                  <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Latest digital products</h2>
                </div>
                <Link href="/products" className="inline-flex items-center gap-2 font-semibold text-[#087B46] hover:underline">
                  View all products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {products.slice(0, 3).map((product) => (
                  <article key={product.id} className="overflow-hidden rounded-2xl border border-[#DCE8E1] bg-white shadow-[0_14px_42px_rgba(20,80,55,.08)]">
                    <div className="aspect-[16/9] overflow-hidden bg-[#FAFAFA] relative">
                      {product.coverImageUrl ? (
                        <>
                          <img src={product.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-xl scale-110 pointer-events-none" aria-hidden="true" />
                          <img src={product.coverImageUrl} alt={product.title} className="relative z-10 h-full w-full object-contain drop-shadow-sm" loading="lazy" />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0B3027] to-[#146047]">
                          <Package className="h-16 w-16 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <span className="text-xs font-bold uppercase tracking-wide text-[#087B46]">{product.subtype || "Digital product"}</span>
                      <h3 className="mt-3 line-clamp-2 text-xl font-bold text-slate-900">{product.title}</h3>
                      <p className="mt-3 line-clamp-2 leading-6 text-slate-600">{product.shortSummary || product.description}</p>
                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#E4ECE8] pt-5">
                        <span className="text-xl font-bold text-slate-900">{productPrice(product.priceMinor, product.currency)}</span>
                        <Link href={`/products/${product.publicSlug || product.id}`} className="font-semibold text-[#087B46] hover:underline">View product</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TRANSPARENT CUSTOMER EXPERIENCE */}
        <section className="py-24 bg-[#F8FAF9] border-t border-[#E2EBE6]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary mb-4">Transparent Experience</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Clear information before payment</h2>
              <p className="mt-4 text-lg text-slate-600">Every CoreSkils product clearly explains what the customer receives, how delivery works, and which policies apply. Trust is built on clarity.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                [FileText, "Review exact deliverables", "Check the contents, format, intended audience, price, licence, and available sample before purchase."],
                [ShieldCheck, "Verified processing", "When checkout is active, access will be granted only after server-side confirmation from the authorised payment gateway."],
                [Headphones, "Delivery and support", "Digital access is provided electronically. Product, access, refund, and privacy questions are handled by dedicated support."],
              ].map(([Icon, title, body]) => {
                const CardIcon = Icon as typeof FileText;
                return (
                  <article key={title as string} className="rounded-3xl border border-[#E2EBE6] bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <CardIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{title as string}</h3>
                    <p className="text-slate-600 leading-relaxed">{body as string}</p>
                  </article>
                );
              })}
            </div>
            
            <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-500">
              <Link href="/shipping-delivery" className="hover:text-primary transition-colors">Digital delivery policy</Link>
              <Link href="/refund-policy" className="hover:text-primary transition-colors">Refund policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms and conditions</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Customer support</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
