"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1145] via-[#211654] to-[#2a1b6b] px-6">
      {/* Glass card */}
      <div className="w-full max-w-md rounded-3xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] px-10 py-12">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 border border-blue-400/30">
            <svg className="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold text-white">Forgot Password</h1>
        <p className="mb-8 text-center text-sm text-white/50">
          Enter your university email. A reset link will appear in the backend terminal.
        </p>

        {submitted ? (
          <div className="rounded-2xl bg-green-500/10 border border-green-400/30 px-6 py-5 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-base font-semibold text-green-300">Reset link generated!</p>
            <p className="mt-1 text-sm text-white/50">Check the backend terminal for the link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-400/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] border border-white/[0.12] px-5 py-4">
              <svg className="h-5 w-5 shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <input
                id="forgot-email"
                type="email"
                placeholder="your@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="forgot-submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#3b5998] to-[#4a6eb5] py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:from-[#4a6eb5] hover:to-[#5a7ec5] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
