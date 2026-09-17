import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, BookOpen, Plus, TrendingUp } from "lucide-react";

export default function TeacherDashboard() {
  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
            <p className="text-muted-foreground mt-1">Overview of your courses and students.</p>
          </div>
          <Button className="font-medium">
            <Plus className="w-4 h-4 mr-2" /> Create Course
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Students", value: "1,240", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
            { label: "Total Revenue", value: "$4,850", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+8%" },
            { label: "Published Courses", value: "4", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10", trend: "0" },
            { label: "Avg. Course Rating", value: "4.8", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10", trend: "+0.1" },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-semibold text-emerald-500 flex items-center">{stat.trend}</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
              <h4 className="text-2xl font-bold">{stat.value}</h4>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Recent Enrollments</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-muted-foreground">
                      S{i}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Student {i}</p>
                      <p className="text-xs text-muted-foreground">Enrolled in UI/UX Design</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Just now</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
            <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12">
                <BookOpen className="w-4 h-4 mr-3 text-muted-foreground" />
                Manage Courses
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                Message Students
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <DollarSign className="w-4 h-4 mr-3 text-muted-foreground" />
                View Payouts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
