import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, CheckCircle2, Trophy, Clock } from "lucide-react";

export default function StudentDashboard() {
  return (
    <DashboardLayout role="student">
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, Alex!</h2>
            <p className="text-muted-foreground mt-1">Pick up right where you left off.</p>
          </div>
          <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Level</p>
              <p className="text-sm font-bold">Level 7 • 3,240 XP</p>
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        <div>
          <h3 className="text-xl font-bold mb-4">Continue Learning</h3>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-48 h-32 bg-muted rounded-xl flex-shrink-0 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop" 
                alt="Course cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40">
                  <Play className="w-5 h-5 text-white fill-white ml-1" />
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <BookOpen className="w-4 h-4" />
                <span>Python for Data Science</span>
              </div>
              <h4 className="text-xl font-bold">Data Visualization with Pandas</h4>
              <p className="text-muted-foreground text-sm">Module 4 • Lesson 3</p>
              
              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Course Progress</span>
                  <span>42%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[42%]" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto flex flex-col gap-2">
              <Button className="w-full md:w-auto h-12 px-8 rounded-xl font-medium">
                Resume Lesson
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Stats */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Learning Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Lessons Completed</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                </div>
                <span className="text-xl font-bold">47</span>
              </div>
              <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Hours Learned</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                </div>
                <span className="text-xl font-bold">14.5</span>
              </div>
            </div>
          </div>

          {/* Upcoming / Tasks */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Up Next</h3>
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-xl bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Assignment</Badge>
                  <span className="text-xs font-medium text-muted-foreground">Due Tomorrow</span>
                </div>
                <p className="font-medium">Build a Neural Network</p>
                <p className="text-xs text-muted-foreground mt-1">Python for Data Science</p>
              </div>
              <div className="p-4 border border-border rounded-xl bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Exam</Badge>
                  <span className="text-xs font-medium text-muted-foreground">Next Week</span>
                </div>
                <p className="font-medium">Midterm Assessment</p>
                <p className="text-xs text-muted-foreground mt-1">UI/UX Design Principles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
