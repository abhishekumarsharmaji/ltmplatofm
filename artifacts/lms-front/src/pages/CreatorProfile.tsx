import { Link, useParams } from "wouter";
import { ExternalLink, Package, BookOpen } from "lucide-react";
import { getGetPublicCreatorProfileQueryKey, useGetPublicCreatorProfile } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";

export default function CreatorProfile() {
  const { username = "" } = useParams();
  const { data, isLoading, isError } = useGetPublicCreatorProfile(username, {
    query: { enabled: !!username, queryKey: getGetPublicCreatorProfileQueryKey(username) },
  });

  if (isLoading) return <PublicLayout><main className="min-h-screen pt-32 text-center">Loading creator…</main></PublicLayout>;
  if (isError || !data) return <PublicLayout><main className="min-h-screen pt-32 text-center"><h1 className="text-3xl font-bold">Creator not found</h1></main></PublicLayout>;
  const { profile, courses, products } = data;

  return (
    <PublicLayout>
      <main className="min-h-screen bg-white pb-24 pt-28">
        <section className="border-b border-[#E2EBE6] bg-[#F4F9F6]">
          <div className="container mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDF5E8] text-3xl font-bold text-[#087B46]">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.displayName} profile`} className="h-full w-full object-cover" /> : profile.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[.14em] text-[#087B46]">CoreSkils Creator</p>
              <h1 className="mt-2 break-words text-4xl font-bold text-slate-950">{profile.displayName}</h1>
              {profile.headline && <p className="mt-2 text-lg text-slate-700">{profile.headline}</p>}
              {profile.bio && <p className="mt-4 max-w-3xl whitespace-pre-line leading-7 text-slate-600">{profile.bio}</p>}
              {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-[#087B46] hover:underline">Creator website <ExternalLink className="h-4 w-4" /></a>}
            </div>
          </div>
        </section>
        <div className="container mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
          {courses.length > 0 && <section>
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><BookOpen className="text-primary" /> Courses by {profile.displayName}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.publicSlug || course.id}`} className="overflow-hidden rounded-xl border border-[#DCE8E1] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-video bg-[#EEF5F1]"><CourseThumbnail src={course.thumbnailUrl} title={course.title} /></div>
                <div className="p-5"><h3 className="text-lg font-bold">{course.title}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p></div>
              </Link>
            ))}</div>
          </section>}
          {products.length > 0 && <section>
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold"><Package className="text-primary" /> Digital products by {profile.displayName}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((product) => (
              <Link key={product.id} href={`/products/${product.publicSlug || product.id}`} className="rounded-xl border border-[#DCE8E1] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wide text-[#087B46]">{product.subtype || "Digital product"}</p><h3 className="mt-2 text-lg font-bold">{product.title}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.shortSummary || product.description}</p>
              </Link>
            ))}</div>
          </section>}
          {!courses.length && !products.length && <p className="rounded-xl border border-[#E2EBE6] bg-[#F8FAF9] p-10 text-center text-slate-600">This creator has not published anything yet.</p>}
        </div>
      </main>
    </PublicLayout>
  );
}