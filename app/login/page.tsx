// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Logo URL - bisa diganti dengan settings dari database
  const logoUrl =
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5kFe_bFCc6TRhYVg_FL5s7xjPyrXNGLFkRfVqfEUxhbJwCOC8mFPOzEOIzdvWWTh1UmM4guinMa8OHwK4n0zwclwZ5UArE28eWC6-v3EwpixIQYC12Mk1t4gyl-yNDzRhz7DmYt1PLtdBxBxpt8gQ8cUvIL_eENyP2_NbB_DRiuMLqSpM4R3tptUp70Yq/s600/Logo_Primary.webp";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", email);

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        console.error("Login error:", loginError);
        setError(`Error: ${loginError.message}`);
        setLoading(false);
        return;
      }

      if (!data.session) {
        console.error("No session returned after login");
        setError("Login failed: No session created");
        setLoading(false);
        return;
      }

      console.log("Login successful:", data);
      console.log("Session created:", data.session);

      // Verify session is saved
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("Session verification failed");
        setError("Login failed: Session not persisted");
        setLoading(false);
        return;
      }

      console.log("Session verified, redirecting to admin...");

      // Refresh router to update server state (cookies) then navigate
      router.refresh();
      router.push("/admin");
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-800 bg-no-repeat bg-cover bg-center bg-[url(https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjN9oQmdsmqogVJbD74a5hDrU0UJQuDbUzcQ2knFTw5YGbJz5R5i6n4FvOmqndZmNhTteIW4USYTDkTRXFEyUcEQWk5ENJbUIFBeuOj5oZqSSB1jnI6M7q7sZajQPzx1fdBQwB5dn7nC_N81UZ-bHBiH95gUgolTjWHegrPaQp6LMV-gSf_pNsUDGf-RE1N/s3125/Bg.webp)]">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-700 shadow-lg rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img
              alt="Jasa Logo #1 Indonesia - Kanglogo.com"
              className="h-8"
              src={logoUrl}
              title="Jasa Logo #1 Indonesia - Kanglogo.com"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                placeholder="halo@kanglogo.com"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              ← Kembali ke Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
