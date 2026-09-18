import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Link, useSearchParams } from "wouter";
import { Search, BookOpen, AlertCircle } from "lucide-react";
import { getMarketplaceCoursesQueryKey, useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";
import { CourseThumbnail } from "@/components/courses/CourseThumbnail";

export default function Courses() {
  // Filters live in the URL (?q=&category=) so the navbar search and shared links work.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateFilters = (next: { q?: string; category?: string }) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      return params;
    }, { replace: true });
  };

  // Debounce typing before it hits the URL and the API.
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const handle = setTimeout(() => updateFilters({ q: searchInput.trim() }), 300);
    return () => clearTimeout(handle);
  }, [searchInput, search]);

  const setCategory = (value: string) => updateFilters({ category: value });
  const clearFilters = () => {
    setSearchInput("");
    updateFilters({ q: "", category: "" });
  };
  
  const queryParams = { 
    ...(search ? { q: search } : {}),
    ...(category ? { category } : {})
  };
  
  const courseQuery = useMarketplaceCourses(queryParams, {
    query: {
      queryKey: getMarketplaceCoursesQueryKey(queryParams),
      // Keep the current catalog visible while filters refetch and allow enough
      // time for an autoscale API process to become ready.
      placeholderData: (previous) => previous,
      retry: 4,
      retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 3000),
      refetchInterval: (query) => query.state.status === "error" ? 3000 : false,
    },
  });
  const categoriesQuery = useListCategories();
  
  const categories = categoriesQuery.data || [];
  const courses = courseQuery.data || [];

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen text-black pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          
          <div className="max-w-3xl mb-9 md:mb-12 text-center mx-auto">
            <h1 className="text-[32px] sm:text-[40px] md:text-[46px] leading-tight font-bold mb-4 text-black">
              Find the right course for your next skill
            </h1>
            <p className="text-[#394649] text-[15px] sm:text-[17px] md:text-[18px]">
              Browse courses created and published by independent instructors across the CoreSkils marketplace.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:gap-8 mb-10 md:mb-16">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9794AA] w-5 h-5" />
              <Input 
                placeholder="What do you want to learn today?" 
                className="pl-12 h-14 bg-white border-[#E5E5E5] text-[16px] text-black rounded-full shadow-sm focus-visible:ring-primary/50"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search courses"
              />
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl">
              <button 
                onClick={() => setCategory("")}
                className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                  category === "" 
                    ? "bg-primary border-primary text-white" 
                    : "bg-white border-[#DADADA] text-[#394649] hover:border-primary"
                }`}
              >
                All Courses
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategory(String(cat.id))}
                  className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                    category === String(cat.id) 
                      ? "bg-primary border-primary text-white" 
                      : "bg-white border-[#DADADA] text-[#394649] hover:border-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {courseQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white h-[320px] animate-pulse">
                  <div className="h-[180px] bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 w-3/4 rounded" />
                    <div className="h-4 bg-gray-200 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courseQuery.isError ? (
            <div className="text-center py-16 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] text-[#394649]">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-[#9794AA]" />
              <h3 className="text-xl font-bold mb-2 text-black">Reconnecting to courses</h3>
              <p className="mb-5">The catalog will refresh automatically in a moment.</p>
              <button
                type="button"
                onClick={() => courseQuery.refetch()}
                disabled={courseQuery.isFetching}
                className="px-5 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:bg-[#10A364] transition-colors disabled:opacity-60"
              >
                {courseQuery.isFetching ? "Reconnecting..." : "Retry now"}
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-[#9794AA]">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#9794AA]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">No courses found</h3>
              <p className="text-[#394649] max-w-md mx-auto">
                We couldn't find any courses matching your current filters. Try adjusting your search terms or category.
              </p>
              <button 
                className="mt-6 px-6 py-2 border border-[#DADADA] text-[#394649] hover:bg-gray-50 rounded-md font-medium"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {courses.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="group rounded-lg border border-[#E5E5E5] bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow duration-300 flex flex-col h-full cursor-pointer overflow-hidden">
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      <CourseThumbnail src={course.thumbnailUrl} title={course.title} className="transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-center text-[13px] text-[#394649] mb-3">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.lessons || 0} Lessons</span>
                        <span className="capitalize">{course.level || "Beginner"}</span>
                      </div>
                      <h3 className="text-[16px] font-bold text-black leading-snug mb-3 line-clamp-2">
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
          
        </div>
      </div>
    </PublicLayout>
  );
}
