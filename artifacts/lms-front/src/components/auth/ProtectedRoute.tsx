import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { useGetSession } from "@workspace/api-client-react";

export function ProtectedRoute({
  role,
  children,
}: {
  role: "student" | "creator" | "admin";
  children: ReactNode;
}) {
  const session = useGetSession();

  if (session.isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center text-muted-foreground">Checking your session…</div>;
  }

  if (!session.data?.authenticated || !session.data.user) {
    return <Redirect to="/auth/login" />;
  }

  if (session.data.user.role !== role) {
    return <Redirect to={`/dashboard/${session.data.user.role}`} />;
  }

  return children;
}
