"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

export default function AdvisorSignup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    if (!email.endsWith(".edu.tr") && !email.endsWith(".edu")) return "Access denied: Please use your official university email address.";
    if (/@st\./.test(email)) return "Advisors must use their official staff email address.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    const errorMsg = validateEmail(email);
    if (errorMsg) {
      setEmailError(errorMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role: "INSTRUCTOR" }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully. Please log in.");
        setTimeout(() => {
          router.push("/login/advisor");
        }, 1500);
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) {
      toast.error("Network error. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1145] via-[#211654] to-[#2a1b6b] px-6">
      <Toaster position="bottom-right" />
      {/* Signup Card */}
      <div className="w-full max-w-lg rounded-[40px] bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] px-8 py-14 sm:px-12 sm:py-16 mt-8 mb-8">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12]">
          <svg
            className="h-10 w-10 text-white/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-3xl font-extrabold text-white sm:text-4xl">
          Advisor Sign Up
        </h1>
        <p className="mb-10 text-center text-base text-white/50">
          Create an account to mentor teams
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Full Name
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <svg
                className="h-5 w-5 shrink-0 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <input
                id="advisor-name"
                type="text"
                placeholder="Dr. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <svg
                className="h-5 w-5 shrink-0 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
              <input
                id="advisor-email"
                type="email"
                placeholder="name@uskudar.edu.tr"
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

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/90">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/[0.1] px-5 py-4">
              <svg
                className="h-5 w-5 shrink-0 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <input
                id="advisor-password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Sign Up button */}
          <button
            type="submit"
            disabled={loading}
            id="advisor-signup-submit"
            className="w-full rounded-2xl bg-gradient-to-r from-[#3b5998] to-[#4a6eb5] py-5 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:from-[#4a6eb5] hover:to-[#5a7ec5] hover:shadow-xl hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Change Role */}
        <Link
          href="/signup"
          className="mt-8 flex items-center justify-center gap-2 text-base font-medium text-white/60 transition-colors hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Change Role
        </Link>
      </div>
    </div>
  );
}
