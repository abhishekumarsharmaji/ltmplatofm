import { PublicLayout } from "@/components/layout/PublicLayout";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function UnavailablePage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground/50 mb-6" />
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
          Currently Unavailable
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mb-8">
          This feature (including payments and checkout) is disabled during the current phase.
        </p>
        <Link href="/">
          <Button size="lg" className="h-12 px-8">Return Home</Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
