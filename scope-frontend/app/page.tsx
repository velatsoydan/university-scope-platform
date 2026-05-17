import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#1a1145] via-[#211654] to-[#2a1b6b]">
      {/* ══════════ HEADER / NAV ══════════ */}
      <header className="relative z-20 w-full pt-5 px-6 lg:px-16">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            {/* Diamond icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L20 8L14 14L8 8L14 2Z" fill="rgba(255,255,255,0.7)" />
              <path d="M14 14L20 20L14 26L8 20L14 14Z" fill="rgba(255,255,255,0.5)" />
              <path d="M2 8L8 14L2 20L-4 14L2 8Z" fill="rgba(255,255,255,0.4)" transform="translate(4,0)" />
              <path d="M20 8L26 14L20 20L14 14L20 8Z" fill="rgba(255,255,255,0.6)" />
            </svg>
            <span className="text-base font-bold tracking-wider text-white">
              SCOPE
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className="px-5 py-2 text-sm font-medium text-white/70 transition-all hover:text-white"
            >
              Home
            </Link>
            <a
              href="#about"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#1a1145] transition-all hover:bg-white/90"
            >
              About Us
            </a>
            <Link
              href="/login/admin"
              className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              Admin
            </Link>
          </div>
        </nav>
      </header>

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-28 sm:pt-28 sm:pb-36">
        {/* Giant SCOPE title */}
        <h1 className="mb-12 text-[5.5rem] font-extrabold tracking-tight text-white sm:text-[8rem] lg:text-[10rem] leading-none">
          SCOPE
        </h1>

        {/* Log In button */}
        <Link
          href="/login"
          id="login-button"
          className="rounded-full border border-white/25 bg-white/[0.07] px-16 py-5 text-xl font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/[0.14] hover:border-white/40 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          Log In
        </Link>
      </section>

      {/* ══════════ FEATURES CONTAINER ══════════ */}
      <section id="about" className="relative z-10 w-full">
        {/* Large rounded container that rises from below */}
        <div className="mx-auto max-w-5xl rounded-t-[60px] bg-white/[0.08] backdrop-blur-lg border border-white/[0.1] border-b-0 px-8 pt-14 pb-16 sm:px-14 sm:rounded-t-[80px]">
          {/* Tagline */}
          <h2 className="mb-14 text-center text-xl font-medium leading-relaxed text-white/90 sm:text-2xl lg:text-[1.7rem]">
            Revolutionize Your University Projects:
            <br />
            Effortless Collaboration, Real-Time Updates.
          </h2>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Connect */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-6 py-10 text-center transition-all hover:bg-white/[0.1]">
              {/* Hierarchy icon */}
              <svg className="mb-4 h-10 w-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span className="text-base font-semibold text-white/90">Connect</span>
            </div>

            {/* Real-Time */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-6 py-10 text-center transition-all hover:bg-white/[0.1]">
              {/* Clock icon */}
              <svg className="mb-4 h-10 w-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-base font-semibold text-white/90">Real-Time</span>
            </div>

            {/* Collaborate */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-6 py-10 text-center transition-all hover:bg-white/[0.1]">
              {/* Users icon */}
              <svg className="mb-4 h-10 w-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span className="text-base font-semibold text-white/90">Collaborate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SCROLL INDICATOR ══════════ */}
      <div className="relative z-10 flex flex-col items-center justify-center py-10 bg-gradient-to-b from-[#2a1b6b] to-[#f0f0f4]">
        <div className="flex flex-col items-center text-white/40">
          {/* Mouse icon */}
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="22" height="34" rx="11" />
            <line x1="12" y1="8" x2="12" y2="14" strokeLinecap="round" />
          </svg>
          {/* Down chevron */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-1">
            <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ══════════ INFO CARDS SECTION ══════════ */}
      <section className="relative z-10 w-full bg-[#f0f0f4] px-6 py-8 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Card 1 */}
          <div className="rounded-[50px] bg-white px-10 py-12 shadow-sm sm:px-16 sm:py-14">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-[2rem]">
              Stay Instantly Informed on Progress!
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
              Real-time updates keep everyone on the same page.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-[50px] bg-white px-10 py-12 shadow-sm sm:px-16 sm:py-14">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-[2rem]">
              Find Team Members Easily!
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
              Connect with talented students who share your vision.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ ILLUSTRATION SECTION ══════════ */}
      <section className="relative z-10 w-full bg-[#f0f0f4] px-6 pb-4 lg:px-16">
        <div className="mx-auto flex max-w-3xl items-center justify-center py-8">
          <Image
            src="/illustration.png"
            alt="Student working at desk with checklist"
            width={600}
            height={450}
            className="w-full max-w-xl h-auto"
          />
        </div>
      </section>

      {/* ══════════ SCROLL INDICATOR 2 ══════════ */}
      <div className="relative z-10 flex flex-col items-center justify-center py-6 bg-gradient-to-b from-[#f0f0f4] to-[#2a1b6b]">
        <div className="flex flex-col items-center text-gray-400">
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="22" height="34" rx="11" />
            <line x1="12" y1="8" x2="12" y2="14" strokeLinecap="round" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-1">
            <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="relative z-10 w-full bg-gradient-to-b from-[#2a1b6b] to-[#1a1145] px-6 pt-0 pb-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          {/* Footer glass container */}
          <div className="rounded-[40px] bg-white/[0.07] backdrop-blur-lg border border-white/[0.1] px-10 py-12 sm:px-14 sm:py-14">
            {/* Scope branding */}
            <h3 className="mb-6 text-4xl font-bold italic text-white/90 sm:text-5xl">
              Scope
            </h3>

            {/* Social icons */}
            <div className="mb-10 flex items-center gap-4">
              {/* Instagram */}
              <a href="/" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all hover:bg-white/10 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="/" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all hover:bg-white/10 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Twitter/X */}
              <a href="/" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all hover:bg-white/10 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
                  Features
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="/" className="text-sm text-white/50 transition-colors hover:text-white/80">
                      Core features
                    </a>
                  </li>
                  <li>
                    <a href="/" className="text-sm text-white/50 transition-colors hover:text-white/80">
                      Integrations
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
                  Learn More
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="/" className="text-sm text-white/50 transition-colors hover:text-white/80">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="/" className="text-sm text-white/50 transition-colors hover:text-white/80">
                      Case studies
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/90">
                  Support
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="/" className="text-sm text-white/50 transition-colors hover:text-white/80">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="/" className="text-sm text-white/50 transition-colors hover:text-white/80">
                      Support
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom copyright bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
            <p className="text-sm text-white/40">
              © 2026 SCOPE. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <a href="/" className="transition-colors hover:text-white/70">Privacy Policy</a>
              <span>|</span>
              <a href="/" className="transition-colors hover:text-white/70">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
