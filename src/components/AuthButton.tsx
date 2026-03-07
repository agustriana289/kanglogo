"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

import Link from "next/link";
import { LogIn, LayoutDashboard } from "lucide-react";

export default function AuthButton({ user }: { user: User | null }) {
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:ring-4 focus:ring-indigo-100 shadow-sm shadow-indigo-200"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:ring-4 focus:ring-indigo-100 shadow-sm shadow-indigo-200"
    >
      Sign In
    </button>
  );
}
