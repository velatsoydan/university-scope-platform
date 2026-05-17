"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    return email.endsWith(".edu.tr") || email.endsWith(".edu");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!validateEmail(email)) {
      setEmailError("Access denied: Please use your official university email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data?.user?.role !== "ADMIN") {
          toast.error("Access denied. Admin role required.");
          setLoading(false);
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data?.user?.role);
        toast.success("Login successful");
        router.push("/dashboard/admin");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1145] via-[#211654] to-[#2a1b6b] px-6">
      <Toaster position="bottom-right" />
      <div className="w-full max-w-lg rounded-[40px] bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] px-8 py-14 sm:px-12 sm:py-16">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12]">
          <svg
            className="h-10 w-10 text-white/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>

        <h1 className="mb-2 text-center text-3xl font-extrabold text-white sm:text-4xl">
          Admin Log In
        </h1>
        <p className="mb-10 text-center text-base text-white/50">
          Enter your details to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">Email</label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <input
                id="admin-email"
                type="email"
                placeholder="admin@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
              />
            </div>
            {emailError && (
              <p className="mt-2 text-sm text-red-500">{emailError}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">Password</label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 text-white/30 hover:text-white/70 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] py-5 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.01]"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-8 flex items-center justify-center gap-2 text-base font-medium text-white/60 transition-colors hover:text-white"
        >
          Back to Roles
        </Link>
      </div>
    </div>
  );
}
