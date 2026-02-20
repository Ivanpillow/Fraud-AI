"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield } from "lucide-react";
import LoginForm from "@/components/login/login-form";
import Testimonial from "@/components/login/testimonial";
import CheckoutFloatingButton from "@/components/checkout/checkout-floating-button";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <main className="flex min-h-screen">
      {/* Left: Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] p-4">
        <Testimonial />
      </div>

      {/* Right: Login Form */}
      <div className="flex w-full lg:w-1/2 xl:w-[45%] flex-col items-center justify-center px-6 py-12 md:px-16">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield size={22} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              FraudAI
            </span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground text-balance">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Access your admin dashboard securely.
            </p>
          </div>

          {/* Form */}
          <LoginForm />

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Only verified administrators can access this panel.
          </p>
        </div>
      </div>

      {/* Floating button to go to Payment Page */}
      <CheckoutFloatingButton />
    </main>
  );
}
