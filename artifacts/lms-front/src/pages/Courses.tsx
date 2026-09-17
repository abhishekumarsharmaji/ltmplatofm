import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, BookOpen, Clock, Star, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useListCourses } from "@workspace/api-client-react";

const MOCK_COURSES = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    instructor: "Sarah Jenkins",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
    rating: 4.8,
    reviews: 1240,
    duration: "42 hours",
    lessons: 320,
    price: "$89.99",
    category: "Development",
    level: "Beginner"
  },
  {
    id: "2",
    title: "Advanced UI/UX Design Principles",
    instructor: "Marcus Chen",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
    rating: 4.9,
    reviews: 856,
    duration: "18 hours",
    lessons: 142,
    price: "$69.99",
    category: "Design",
    level: "Advanced"
  },
  {
    id: "3",
    title: "Python for Data Science & Machine Learning",
    instructor: "Dr. Elena Rodriguez",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    rating: 4.7,
    reviews: 2150,
    duration: "35 hours",
    lessons: 280,
    price: "$94.99",
    category: "Data Science",
    level: "Intermediate"
  },
  {
    id: "4",
    title: "Digital Marketing Masterclass",
    instructor: "James Wilson",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=400&fit=crop",
    rating: 4.6,
    reviews: 930,
    duration: "24 hours",
    lessons: 195,
    price: "$59.99",
    category: "Marketing",
    level: "Beginner"
  },
  {
    id: "5",
    title: "React Native Mobile App Development",
    instructor: "Sarah Jenkins",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
    rating: 4.8,
    reviews: 642,
    duration: "28 hours",
    lessons: 210,
    price: "$79.99",
    category: "Development",
    level: "Intermediate"
  },
  {
    id: "6",
    title: "Financial Modeling & Valuation",
    instructor: "David Thompson",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    rating: 4.9,
    reviews: 1420,
    duration: "15 hours",
    lessons: 110,
    price: "$119.99",
    category: "Business",
    level: "Advanced"
  }
];

const CATEGORIES = ["All", "Development", "Design", "Data Science", "Marketing", "Business"];

export default function Courses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const courseQuery = useListCourses();
  const sourceCourses = courseQuery.data?.length
    ? courseQuery.data.map((course, index) => ({
        id: String(course.id),
        title: course.title,
        instructor: ["Sarah Jenkins", "Marcus Chen", "Dr. Elena Rodriguez"][index % 3],
        image: MOCK_COURSES[index % MOCK_COURSES.length].image,
        rating: 4.8,
        reviews: 320 + index * 184,
        duration: `${Math.max(4, Math.round(course.lessons * 0.75))} hours`,
        lessons: course.lessons,
        price: index === 0 ? "Free" : `$${59 + index * 10}.99`,
        category: ["Development", "Design", "Data Science"][index % 3],
        level: course.level,
      }))
    : MOCK_COURSES;

  const filteredCourses = sourceCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) || 
                          course.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || course.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <PublicLayout>
      <div className="bg-[#0A0A0A] min-h-screen text-white pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          
          <div className="max-w-3xl mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Courses</h1>
            <p className="text-zinc-400 text-lg">
              Explore our comprehensive catalog of courses taught by industry experts.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <Input 
                placeholder="Search for courses, skills, or instructors..." 
                className="pl-10 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {CATEGORIES.map(cat => (
                <Button 
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  className={category === cat 
                    ? "bg-blue-600 hover:bg-blue-500 rounded-xl whitespace-nowrap" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl whitespace-nowrap"}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
              <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl ml-2">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">No courses found</h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                We couldn't find any courses matching your current filters. Try adjusting your search terms or category.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-zinc-700 bg-zinc-800 text-white"
                onClick={() => { setSearch(""); setCategory("All"); }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-800/40 transition-all duration-300 group cursor-pointer flex flex-col h-full">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-md border-zinc-700 text-white font-medium">
                        {course.category}
                      </Badge>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-4">{course.instructor}</p>
                      
                      <div className="flex items-center gap-1 mb-4 text-sm">
                        <span className="font-bold text-amber-400">{course.rating}</span>
                        <div className="flex items-center text-amber-400">
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-zinc-500 ml-1">({course.reviews.toLocaleString()})</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {course.lessons} lessons
                          </span>
                        </div>
                        <span className="font-bold text-lg text-white">{course.price}</span>
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
