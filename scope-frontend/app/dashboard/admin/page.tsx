"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, FolderKanban, LogOut, Plus, Search, X, Award, ChevronDown,
  Activity, CheckCircle, Pencil,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); we append /api per call,
// matching app/dashboard/student/profile/page.tsx convention.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma
// -----------------------------------------------------------------------------
type BackendRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";
type BackendUserStatus = "ACTIVE" | "INACTIVE";
type BackendProjectStatus =
  | "DRAFT" | "PENDING_ADVISOR" | "ADVISOR_ASSIGNED"
  | "IN_PROGRESS" | "REVIEW_PHASE" | "COMPLETED";

interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  status: BackendUserStatus;
  createdAt: string;
}

interface CategoryDTO {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  requiredSkills: string[];
  status: BackendProjectStatus;
  createdAt: string;
  category: { id: string; name: string };
  owner: { id: string; name: string };
  advisor: { id: string; name: string; email: string } | null;
  teamMembers: Array<{ id: string; userId: string; role: string }>;
}

interface AnnouncementDTO {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

// UI-level role label (3rd entry covers backend ADMIN users)
type UIRole = "Student" | "Advisor" | "Admin";
type UIRoleFilter = "All" | UIRole;
type UIStatus = "Active" | "Inactive";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function backendRoleToUI(role: BackendRole): UIRole {
  switch (role) {
    case "STUDENT": return "Student";
    case "INSTRUCTOR": return "Advisor";
    case "ADMIN": return "Admin";
  }
}

function backendStatusToUI(s: BackendUserStatus): UIStatus {
  return s === "ACTIVE" ? "Active" : "Inactive";
}

/** Buckets the 6 backend ProjectStatus values into the 3 the design supports. */
function projectStatusBucket(s: BackendProjectStatus): "Draft" | "Active" | "Completed" {
  if (s === "DRAFT") return "Draft";
  if (s === "COMPLETED") return "Completed";
  return "Active";
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function AdminDashboard() {
  const router = useRouter();

  // UI toggles
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Search + filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UIRoleFilter>("All");
  const [filterCategoryId, setFilterCategoryId] = useState<"All" | string>("All");

  // Form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    category: "General" as "TÜBİTAK" | "Teknofest" | "Course" | "General",
    content: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  // Server data
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${API_URL}/admin/users`, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Users fetch failed (${res.status})`);
    const data = (await res.json()) as { users: UserDTO[] };
    setUsers(data.users ?? []);
  }, []);

  const fetchProjects = useCallback(async () => {
    const res = await fetch(`${API_URL}/projects`, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Projects fetch failed (${res.status})`);
    const data = (await res.json()) as { projects: ProjectDTO[] };
    setProjects(data.projects ?? []);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(`${API_URL}/admin/categories`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Categories fetch failed (${res.status})`);
    const data = (await res.json()) as { categories: CategoryDTO[] };
    setCategories(data.categories ?? []);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch(`${API_URL}/admin/announcements`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Announcements fetch failed (${res.status})`);
    const data = (await res.json()) as { announcements: AnnouncementDTO[] };
    setAnnouncements(data.announcements ?? []);
  }, []);

  useEffect(() => {
    // Auth guard — kick anyone without an admin token to the login page.
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "ADMIN") {
      router.push("/login/admin");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(),
          fetchProjects(),
          fetchCategories(),
          fetchAnnouncements(),
        ]);
      } catch (err) {
        console.error("Admin dashboard load failed:", err);
        const message = err instanceof Error ? err.message : "Failed to load data";
        if (/401|403/.test(message)) {
          localStorage.removeItem("token");
          router.push("/login/admin");
          return;
        }
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, fetchUsers, fetchProjects, fetchCategories, fetchAnnouncements]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeProjects = projects.filter(p => projectStatusBucket(p.status) === "Active").length;
    // teamMatches = total number of team memberships across the system.
    const teamMatches = projects.reduce((acc, p) => acc + p.teamMembers.length, 0);
    // Backend has no concept of "online" — best proxy is users with ACTIVE status.
    const onlineUsers = users.filter(u => u.status === "ACTIVE").length;
    return { totalUsers, activeProjects, teamMatches, onlineUsers };
  }, [users, projects]);

  const filteredUsers = useMemo(() => users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      user.email.toLowerCase().includes(q) ||
      user.name.toLowerCase().includes(q);
    const uiRole = backendRoleToUI(user.role);
    const matchesRole = filterRole === "All" || uiRole === filterRole;
    return matchesSearch && matchesRole;
  }), [users, searchQuery, filterRole]);

  const filteredProjects = useMemo(() => projects.filter(project => {
    const q = projectSearchQuery.toLowerCase();
    const matchesSearch =
      projectSearchQuery === "" ||
      project.title.toLowerCase().includes(q) ||
      project.owner.name.toLowerCase().includes(q) ||
      project.requiredSkills.some(skill => skill.toLowerCase().includes(q));
    const matchesCategory = filterCategoryId === "All" || project.category.id === filterCategoryId;
    return matchesSearch && matchesCategory;
  }), [projects, projectSearchQuery, filterCategoryId]);

  // First 4 categories from the DB become filter chips (keeps the existing
  // chip-row layout density, regardless of which categories the admin seeded).
  const filterCategoryChips = useMemo(() => categories.slice(0, 4), [categories]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    router.push("/");
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newAnnouncement),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setShowCreateModal(false);
      setNewAnnouncement({ title: "", category: "General", content: "" });
      await fetchAnnouncements();
      toast.success("Announcement Created!", {
        description: "The announcement has been published to all users.",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Create announcement failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/toggle-status`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      await fetchUsers();
      toast.success(`User ${target.status === "ACTIVE" ? "Deactivated" : "Activated"}`, {
        duration: 3000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Toggle user status failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setShowCategoryModal(false);
      setNewCategoryName("");
      await fetchCategories();
      toast.success("Category Created!", {
        description: "The category has been added successfully.",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Create category failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: editCategoryName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      setEditCategoryName("");
      await fetchCategories();
      toast.success("Category Updated!", {
        duration: 3000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Update category failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      await fetchCategories();
      toast.success("Category Deleted!", {
        duration: 3000,
        className: "bg-red-500/90 backdrop-blur-xl text-white border-red-400/50",
      });
    } catch (err) {
      console.error("Delete category failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 relative overflow-hidden">
      <Toaster position="bottom-right" />

      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

      {/* Top Navigation Bar */}
      <nav className="relative z-20 px-8 py-4">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Award className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">SCOPE</div>
            <span className="px-4 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs font-semibold border border-purple-400/30">
              Admin
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-4 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AD</span>
              </div>
              <div className="text-left">
                <p className="text-white/60 text-xs">Admin Panel</p>
                <p className="text-white font-semibold">System Admin</p>
              </div>
              <ChevronDown className="w-5 h-5 text-white/60" strokeWidth={2} />
            </button>

            {showProfileDropdown && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[30px] shadow-2xl overflow-hidden animate-slideDown">
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-4 text-red-500 hover:bg-red-50 transition-all flex items-center space-x-3 text-left"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 px-8 py-6 space-y-6">
        {/* Row 1: Live Stats */}
        <div className="grid grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-300" strokeWidth={2} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Total Users</p>
            <p className="text-white text-4xl font-bold">{stats.totalUsers}</p>
          </div>

          {/* Active Projects */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-purple-300" strokeWidth={2} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Active Projects</p>
            <p className="text-white text-4xl font-bold">{stats.activeProjects}</p>
          </div>

          {/* Team Matches */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-300" strokeWidth={2} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Team Matches</p>
            <p className="text-white text-4xl font-bold">{stats.teamMatches}</p>
          </div>

          {/* Online Users with Live Indicator */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-yellow-300" strokeWidth={2} />
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 text-xs font-semibold">Live</span>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Online Users</p>
            <p className="text-white text-4xl font-bold">{stats.onlineUsers}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* User Management Section */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex space-x-3">
                {(["All", "Student", "Advisor", "Admin"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      filterRole === role
                        ? "bg-blue-500/30 text-blue-200 border border-blue-400/50"
                        : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => {
                const uiRole = backendRoleToUI(user.role);
                const uiStatus = backendStatusToUI(user.status);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{user.name}</p>
                      <p className="text-white/50 text-sm">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                        uiRole === "Student"
                          ? "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                          : uiRole === "Advisor"
                          ? "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                          : "bg-pink-500/20 text-pink-200 border border-pink-400/30"
                      }`}>
                        {uiRole}
                      </span>
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                          uiStatus === "Active"
                            ? "bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/30"
                            : "bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-green-500/20 hover:text-green-200 hover:border-green-400/30"
                        }`}
                      >
                        {uiStatus === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <p className="text-white/40 text-sm text-center py-6">No users found</p>
              )}
            </div>
          </div>

          {/* Project Exploration */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
            <h2 className="text-2xl font-bold text-white mb-6">Project Exploration</h2>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search by title, owner, or tech stack..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex space-x-3 flex-wrap gap-y-2">
                <button
                  onClick={() => setFilterCategoryId("All")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    filterCategoryId === "All"
                      ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                      : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                  }`}
                >
                  All
                </button>
                {filterCategoryChips.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilterCategoryId(c.id)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      filterCategoryId === c.id
                        ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                        : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProjects.map((project) => {
                const bucket = projectStatusBucket(project.status);
                return (
                  <div
                    key={project.id}
                    className="px-6 py-4 bg-white/10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{project.title}</p>
                        <p className="text-white/50 text-sm">by {project.owner.name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bucket === "Active"
                          ? "bg-green-500/20 text-green-200 border border-green-400/30"
                          : bucket === "Draft"
                          ? "bg-yellow-500/20 text-yellow-200 border border-yellow-400/30"
                          : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                      }`}>
                        {bucket}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.requiredSkills.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <p className="text-white/40 text-sm text-center py-6">No projects found</p>
              )}
            </div>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Global Announcements</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white/10 rounded-[40px] border border-white/20 p-6 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                    announcement.category === "TÜBİTAK"
                      ? "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                      : announcement.category === "Teknofest"
                      ? "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                      : announcement.category === "Course"
                      ? "bg-yellow-500/20 text-yellow-200 border border-yellow-400/30"
                      : "bg-gray-500/20 text-gray-200 border border-gray-400/30"
                  }`}>
                    {announcement.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{announcement.title}</h3>
                <p className="text-white/60 text-sm mb-3">{announcement.content}</p>
                <p className="text-white/40 text-xs">{formatDate(announcement.createdAt)}</p>
              </div>
            ))}

            {announcements.length === 0 && (
              <p className="text-white/40 text-sm col-span-3 text-center py-6">No announcements yet</p>
            )}
          </div>
        </div>

        {/* Manage Categories Section */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white/10 rounded-[40px] border border-white/20 p-6 hover:bg-white/15 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-white/40 text-xs">{formatDate(category.createdAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setEditCategoryName(category.name);
                        setShowEditCategoryModal(true);
                      }}
                      className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-4 h-4 text-blue-300" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4 text-red-300" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-white/40 text-sm col-span-4 text-center py-6">No categories yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Create Announcement</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Category</label>
                <select
                  value={newAnnouncement.category}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value as "TÜBİTAK" | "Teknofest" | "Course" | "General" })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="General" className="text-gray-900">General</option>
                  <option value="TÜBİTAK" className="text-gray-900">TÜBİTAK</option>
                  <option value="Teknofest" className="text-gray-900">Teknofest</option>
                  <option value="Course" className="text-gray-900">Course</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Content</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                  placeholder="Enter announcement content"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCreateAnnouncement}
                disabled={submitting}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Publishing..." : "Publish Announcement"}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Create Category</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Enter category name"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCreateCategory}
                disabled={submitting}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Category"}
              </button>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Edit Category</h2>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryName("");
                }}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Category Name</label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Enter new category name"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleUpdateCategory}
                disabled={submitting}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Updating..." : "Update Category"}
              </button>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                  setEditCategoryName("");
                }}
                className="flex-1 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
