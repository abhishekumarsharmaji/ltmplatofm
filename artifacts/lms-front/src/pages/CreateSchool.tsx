import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { Rocket } from "lucide-react";

export default function CreateSchool() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/dashboard/admin");
    }, 1500);
  };

  return (
    <PublicLayout>
      <div className="bg-[#0A0A0A] min-h-screen text-white pt-24 pb-20 flex flex-col items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-10 space-y-4">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Create your school</h1>
            <p className="text-zinc-400">Launch your own academy in seconds. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input 
                id="schoolName" 
                placeholder="e.g. Design Academy" 
                required 
                className="bg-zinc-800/50 border-zinc-700 h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex">
                <Input 
                  id="subdomain" 
                  placeholder="designacademy" 
                  required 
                  className="bg-zinc-800/50 border-zinc-700 h-12 rounded-r-none border-r-0"
                />
                <div className="bg-zinc-800 border border-zinc-700 border-l-0 px-4 flex items-center text-zinc-400 text-sm rounded-r-md h-12">
                  .lmsplatform.com
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Your Admin Email</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="you@example.com" 
                required 
                className="bg-zinc-800/50 border-zinc-700 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input 
                id="password" 
                type="password"
                required 
                className="bg-zinc-800/50 border-zinc-700 h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Launch School"}
            </Button>
            
            <p className="text-center text-sm text-zinc-500">
              By creating a school, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
