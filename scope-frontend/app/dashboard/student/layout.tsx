"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home as HomeIcon, Users, Search, FolderOpen, FileText, LogOut, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); endpoints below prepend
// /api explicitly to stay consistent with the rest of the app.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

function humanizeRole(role: string | null | undefined): string {
    if (!role) return "Student";
    switch (role.toUpperCase()) {
        case "STUDENT": return "Student";
        case "INSTRUCTOR": return "Advisor";
        case "ADMIN": return "Admin";
        default: return role;
    }
}

function initialsOf(name: string): string {
    if (!name) return "?";
    return name.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
}

interface SessionUser {
    name: string;
    role: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [user, setUser] = useState<SessionUser | null>(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        router.push("/");
    };

    useEffect(() => {
        // Auth guard — kick anyone without a token straight to login.
        const token = getToken();
        if (!token) {
            router.push("/login/student");
            return;
        }

        // Optimistic UI: paint immediately from cached localStorage values
        // so the sidebar doesn't flash "Loading..." on every navigation.
        const localName = localStorage.getItem("userName");
        const localRole = localStorage.getItem("userRole");
        if (localName) {
            setUser({ name: localName, role: humanizeRole(localRole) });
        }

        // Authoritative fetch — refresh from /me; if the server rejects the
        // token, clear the session and redirect.
        (async () => {
            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });

                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userName");
                    localStorage.removeItem("userRole");
                    router.push("/login/student");
                    return;
                }
                if (!res.ok) return; // Transient — keep optimistic UI

                const data = await res.json();
                if (data.user) {
                    setUser({ name: data.user.name, role: humanizeRole(data.user.role) });
                    localStorage.setItem("userName", data.user.name);
                    localStorage.setItem("userRole", data.user.role);
                }
            } catch (error) {
                // Network errors fall through — cached data continues to render.
                console.error("Failed to fetch user data", error);
            }
        })();
    }, [router]);

    const sidebarItems = [
        { icon: HomeIcon, label: "My Hub", href: "/dashboard/student" },
        { icon: Users, label: "Team Ads", href: "/dashboard/student/team-ads" },
        { icon: Search, label: "Find Advisor", href: "/dashboard/student/find-advisor" },
        { icon: FolderOpen, label: "My Projects", href: "/dashboard/student/my-projects" },
        { icon: FileText, label: "My Applications", href: "/dashboard/student/my-applications" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
            {/* Dark Grain texture overlay */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px'
            }}></div>

            <div className="flex h-screen relative">
                {/* Dark Glassmorphism Sidebar */}
                <aside className="w-72 bg-white/10 backdrop-blur-2xl border-r border-white/20 flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/20">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="4" fill="#2c3e50" />
                                    <path d="M12 2L12 7M12 17L12 22M2 12L7 12M17 12L22 12" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">SCOPE</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto z-10 relative">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-[28px] transition-all duration-200 text-left group cursor-pointer ${isActive
                                            ? "bg-white/90 text-gray-900 shadow-lg"
                                            : "text-white/80 hover:text-white hover:bg-white/15"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                                    <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile Section (Bottom) */}
                    <div className="relative p-6 border-t border-white/20 z-20">
                        <button
                            onClick={() => setShowProfilePopup(!showProfilePopup)}
                            className="w-full flex items-center space-x-3 px-5 py-4 rounded-[28px] text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 text-left cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                {user ? (
                                    <span className="text-white font-bold text-sm">{initialsOf(user.name)}</span>
                                ) : (
                                    <UserCircle className="w-6 h-6 text-white" strokeWidth={2} />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{user ? user.name : "Loading..."}</p>
                                <p className="text-xs text-white/60">{user ? user.role : "Student"}</p>
                            </div>
                        </button>

                        {/* Profile Popup */}
                        {showProfilePopup && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowProfilePopup(false)}
                                ></div>

                                {/* Popup Menu */}
                                <div className="absolute bottom-full left-6 right-6 mb-3 bg-white/15 backdrop-blur-2xl rounded-[40px] border border-white/30 p-3 shadow-2xl z-50 animate-slideUp">
                                    <button
                                        onClick={() => {
                                            setShowProfilePopup(false);
                                            router.push("/dashboard/student/profile");
                                        }}
                                        className="w-full flex items-center space-x-3 px-5 py-4 rounded-[28px] text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 text-left group cursor-pointer"
                                    >
                                        <UserCircle className="w-5 h-5" strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Profile</span>
                                    </button>

                                    <div className="h-px bg-white/20 my-2 mx-3"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-5 py-4 rounded-[28px] text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all duration-200 text-left group cursor-pointer"
                                    >
                                        <LogOut className="w-5 h-5" strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Log Out</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative z-10 text-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
