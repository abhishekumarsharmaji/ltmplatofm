import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, BookOpen, AlertCircle } from "lucide-react";
import { useMarketplaceCourses, useListCategories } from "@workspace/api-client-react";

export default function Courses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  
  const queryParams = { 
    ...(search ? { q: search } : {}),
    ...(category ? { category } : {})
  };
  
  const courseQuery = useMarketplaceCourses(queryParams);
  const categoriesQuery = useListCategories();
  
  const categories = categoriesQuery.data || [];
  const courses = courseQuery.data || [];

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen text-black pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          
          <div className="max-w-3xl mb-12 text-center mx-auto">
            <h1 className="text-[40px] md:text-[46px] font-bold mb-4 text-black">
              Explore Inspiring Online Courses
            </h1>
            <p className="text-[#394649] text-[18px]">
              Join thousands of learners and take your career to the next level with our expert-led courses.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 mb-16">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9794AA] w-5 h-5" />
              <Input 
                placeholder="What do you want to learn today?" 
                className="pl-12 h-14 bg-white border-[#E5E5E5] text-[16px] text-black rounded-full shadow-sm focus-visible:ring-primary/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  onClick={() => setCategory(cat.slug)}
                  className={`px-5 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                    category === cat.slug 
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="text-center py-20 bg-red-50 rounded-lg border border-red-100 text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error loading courses</h3>
              <p>Please try again later.</p>
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
                onClick={() => { setSearch(""); setCategory(""); }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="group rounded-lg border border-[#E5E5E5] bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow duration-300 flex flex-col h-full cursor-pointer overflow-hidden">
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                          <span className="text-4xl text-primary/30 font-bold">{course.title[0]}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
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
