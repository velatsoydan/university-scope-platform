import Link from "next/link";

// ⚠️  DEVELOPER NOTE: This page is intentionally hidden from all UI navigation.
// Access it only by typing the URL directly: /signup/student or /signup/advisor

export default function SignupRoleSelect() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1145] via-[#211654] to-[#2a1b6b] px-6">
      <h1 className="mb-3 text-5xl font-extrabold text-white sm:text-6xl text-center">
        Create Account
      </h1>
      <p className="mb-16 text-lg text-white/60 sm:text-xl text-center">
        Select your role to register
      </p>

      <div className="flex w-full max-w-xl flex-col gap-6 sm:flex-row sm:gap-8">
        {/* Student */}
        <Link
          href="/signup/student"
          id="signup-role-student"
          className="group flex flex-1 flex-col items-center justify-center rounded-3xl bg-white/[0.07] backdrop-blur-lg border border-white/[0.1] px-8 py-14 text-center transition-all duration-300 hover:bg-white/[0.12] hover:border-white/[0.2] hover:scale-[1.02]"
        >
          <svg className="mb-6 h-16 w-16 text-white/80 transition-colors group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75m0 0h-.008v.008H6.75V11.25z" />
          </svg>
          <h2 className="mb-2 text-2xl font-bold text-white">As Student</h2>
          <p className="text-sm text-white/50">Join teams and work on projects</p>
        </Link>

        {/* Advisor */}
        <Link
          href="/signup/advisor"
          id="signup-role-advisor"
          className="group flex flex-1 flex-col items-center justify-center rounded-3xl bg-white/[0.07] backdrop-blur-lg border border-white/[0.1] px-8 py-14 text-center transition-all duration-300 hover:bg-white/[0.12] hover:border-white/[0.2] hover:scale-[1.02]"
        >
          <svg className="mb-6 h-16 w-16 text-white/80 transition-colors group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <h2 className="mb-2 text-2xl font-bold text-white">As Advisor</h2>
          <p className="text-sm text-white/50">Mentor teams and guide projects</p>
        </Link>
      </div>

      <Link
        href="/login"
        className="mt-14 flex items-center gap-2 text-base font-medium text-white/70 transition-colors hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Login
      </Link>
    </div>
  );
}
