import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, BookOpen, Clock, Star, Filter, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <div className="bg-background min-h-screen text-foreground pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          
          <div className="max-w-3xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Courses</h1>
            <p className="text-muted-foreground text-lg">
              Explore our comprehensive catalog of courses taught by industry experts.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search for courses..." 
                className="pl-10 h-12 bg-card border-border text-foreground rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar items-center">
              <Button 
                variant={category === "" ? "default" : "outline"}
                className={category === "" ? "rounded-xl whitespace-nowrap" : "bg-card border-border text-foreground rounded-xl whitespace-nowrap"}
                onClick={() => setCategory("")}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button 
                  key={cat.id}
                  variant={category === cat.slug ? "default" : "outline"}
                  className={category === cat.slug 
                    ? "rounded-xl whitespace-nowrap" 
                    : "bg-card border-border text-foreground rounded-xl whitespace-nowrap"}
                  onClick={() => setCategory(cat.slug)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {courseQuery.isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : courseQuery.isError ? (
            <div className="text-center py-20 bg-destructive/10 rounded-3xl border border-destructive/20 text-destructive">
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error loading courses</h3>
              <p>Please try again later.</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No courses found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any courses matching your current filters. Try adjusting your search terms or category.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-border"
                onClick={() => { setSearch(""); setCategory(""); }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group cursor-pointer flex flex-col h-full shadow-sm">
                    <div className="relative aspect-video overflow-hidden bg-muted flex items-center justify-center">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <BookOpen className="w-12 h-12 text-muted-foreground/30 transition-transform duration-500 group-hover:scale-110" />
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-background/80 backdrop-blur-md border-border text-foreground font-medium capitalize">
                          {course.level || "Beginner"}
                        </Badge>
                        <Badge className="bg-success text-success-foreground font-bold">
                          Free
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.creatorName && (
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          by {course.creatorName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                      
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {course.lessons} lessons
                          </span>
                        </div>
                        <span className="text-sm font-bold text-primary">Learn Now</span>
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
