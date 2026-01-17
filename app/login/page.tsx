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
        setError("Login gagal: Tidak ada session");
        setLoading(false);
        return;
      }

      console.log("Login successful:", data);
      console.log("Session created:", data.session);
      window.location.href = "/admin";
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center py-8 px-4 md:px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-2">
            <img
              alt="Jasa Logo #1 Indonesia - Kanglogo.com"
              className="h-10 md:h-12"
              src={logoUrl}
              title="Jasa Logo #1 Indonesia - Kanglogo.com"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
                placeholder="halo@kanglogo.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary/90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 text-base md:text-lg mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⚙️</span>
                  Sedang Login...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Back to Home Link */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <Link
              href="/"
              className="text-sm text-primary hover:text-primary/80 font-medium transition"
            >
              ← Kembali ke Homepage
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8 text-slate-600 text-xs md:text-sm">
          <p>Lupa password? Hubungi administrator</p>
        </div>
      </div>
    </section>
  );
}
