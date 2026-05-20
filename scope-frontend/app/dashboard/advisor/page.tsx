"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  Bell,
  CheckCircle,
  Calendar,
  DollarSign,
  X,
  Check,
  Edit3,
  LogOut,
  ChevronDown,
  FileText,
  Award,
  Target,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); we append /api per call,
// matching the convention used in app/dashboard/student/profile/page.tsx.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma
// -----------------------------------------------------------------------------
type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface CategoryDTO {
  id: string;
  name: string;
}

interface TeamMemberDTO {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface ProjectInRequestDTO {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  requiredSkills: string[];
  status: string;
  createdAt: string;
  category: CategoryDTO;
  owner: { id: string; name: string; email: string };
  teamMembers: TeamMemberDTO[];
  teamAd: { id: string; technicalSkills: string[] } | null;
}

interface AdvisorRequestDTO {
  id: string;
  projectId: string;
  advisorId: string;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  project: ProjectInRequestDTO;
}

interface AdvisedProjectDTO {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  status: string;
  createdAt: string;
  category: CategoryDTO;
  owner: { id: string; name: string; email: string };
  teamMembers: TeamMemberDTO[];
}

interface AdvisorProfileDTO {
  title: string | null;
  department: string | null;
  isAvailable: boolean;
  expertise: string[];
  researchInterests: string[];
  previousProjects: string[];
}

interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    advisorProfile: AdvisorProfileDTO | null;
  };
}

interface AnnouncementDTO {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

type ViewMode = "dashboard" | "profile-showcase" | "announcements";

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
      month: "long", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function humanizeProjectStatus(s: string): string {
  switch (s) {
    case "PENDING_ADVISOR": return "Pending Advisor";
    case "ADVISOR_ASSIGNED": return "Advisor Assigned";
    case "IN_PROGRESS": return "In Progress";
    case "REVIEW_PHASE": return "Review Phase";
    case "COMPLETED": return "Completed";
    case "DRAFT": return "Draft";
    default: return s;
  }
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function AdvisorDashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  // Modal toggles
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showOngoingDetailModal, setShowOngoingDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdvisorRequestDTO | null>(null);
  const [selectedOngoingProject, setSelectedOngoingProject] = useState<AdvisedProjectDTO | null>(null);

  // Loading flags
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Server data
  const [profile, setProfile] = useState({
    name: "",
    title: "",
    department: "",
    email: "",
    expertise: [] as string[],
    researchInterests: [] as string[],
    previousProjects: [] as string[],
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [requests, setRequests] = useState<AdvisorRequestDTO[]>([]);
  const [advisedProjects, setAdvisedProjects] = useState<AdvisedProjectDTO[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);

  const [editFormData, setEditFormData] = useState(profile);

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login/advisor");
      return;
    }
    const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders(), cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      router.push("/login/advisor");
      return;
    }
    if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
    const data = (await res.json()) as MeResponse;
    const ap = data.user.advisorProfile;
    setProfile({
      name: data.user.name,
      title: ap?.title ?? "",
      department: ap?.department ?? "",
      email: data.user.email,
      expertise: ap?.expertise ?? [],
      researchInterests: ap?.researchInterests ?? [],
      previousProjects: ap?.previousProjects ?? [],
    });
    setIsAvailable(ap?.isAvailable ?? true);
  }, [router]);

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`${API_URL}/advisors/requests`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`Requests fetch failed (${res.status})`);
    const data = (await res.json()) as { requests: AdvisorRequestDTO[] };
    setRequests(data.requests ?? []);
  }, []);

  const fetchAdvisedProjects = useCallback(async () => {
    const res = await fetch(`${API_URL}/projects/advised`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`Advised projects fetch failed (${res.status})`);
    const data = (await res.json()) as { projects: AdvisedProjectDTO[] };
    setAdvisedProjects(data.projects ?? []);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    // Public endpoint — no auth required
    const res = await fetch(`${API_URL}/admin/announcements`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Announcements fetch failed (${res.status})`);
    const data = (await res.json()) as { announcements: AnnouncementDTO[] };
    setAnnouncements(data.announcements ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProfile(),
          fetchRequests(),
          fetchAdvisedProjects(),
          fetchAnnouncements(),
        ]);
      } catch (err) {
        console.error("Advisor dashboard load failed:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfile, fetchRequests, fetchAdvisedProjects, fetchAnnouncements]);

  // Seed the edit form whenever we open the modal (or profile reloads).
  useEffect(() => {
    setEditFormData(profile);
  }, [profile]);

  // ---------------------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const pendingRequests = requests.filter(r => r.status === "PENDING").length;
    const activeProjects = advisedProjects.filter(p => p.status !== "COMPLETED").length;
    // Unique student ids across all advised teams.
    const studentIds = new Set<string>();
    for (const p of advisedProjects) {
      for (const m of p.teamMembers) studentIds.add(m.userId);
    }
    return { pendingRequests, activeProjects, totalStudents: studentIds.size };
  }, [requests, advisedProjects]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const respondToRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`${API_URL}/advisors/${requestId}/respond`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const updatedRequest = requests.find(r => r.id === requestId);
      setShowProjectDetailModal(false);

      // Re-fetch authoritative data — accepting one request auto-rejects the
      // others on the project, and the advised list changes too.
      await Promise.all([fetchRequests(), fetchAdvisedProjects()]);

      if (status === "ACCEPTED") {
        toast.success("Request Accepted!", {
          description: updatedRequest
            ? `${updatedRequest.project.title} has been added to your ongoing projects.`
            : undefined,
          duration: 4000,
          className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
        });
      } else {
        toast.error("Request Declined", {
          description: updatedRequest
            ? `You have declined the request for "${updatedRequest.project.title}".`
            : undefined,
          duration: 4000,
          className: "bg-red-500/90 backdrop-blur-xl text-white border-red-400/50",
        });
      }
    } catch (err) {
      console.error("Respond failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to respond");
    }
  };

  const handleAcceptRequest = (requestId: string) => respondToRequest(requestId, "ACCEPTED");
  const handleRejectRequest = (requestId: string) => respondToRequest(requestId, "REJECTED");

  const handleViewProjectDetails = (request: AdvisorRequestDTO) => {
    setSelectedRequest(request);
    setShowProjectDetailModal(true);
  };

  const handleViewOngoingDetails = (project: AdvisedProjectDTO) => {
    setSelectedOngoingProject(project);
    setShowOngoingDetailModal(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name: editFormData.name,
          title: editFormData.title,
          department: editFormData.department,
          expertise: editFormData.expertise,
          researchInterests: editFormData.researchInterests,
          previousProjects: editFormData.previousProjects,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      // Reflect locally + reload so localStorage userName stays in sync.
      setProfile(editFormData);
      localStorage.setItem("userName", editFormData.name);
      setShowEditProfileModal(false);
      toast.success("Profile Updated!", {
        description: "Your profile has been updated successfully.",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    const next = !isAvailable;
    // Optimistic toggle — feels instant.
    setIsAvailable(next);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Availability update failed:", err);
      // Roll back
      setIsAvailable(!next);
      toast.error(err instanceof Error ? err.message : "Failed to update availability");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/");
  };

  const initials = profile.name
    ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 3)
    : "?";

  // ---------------------------------------------------------------------------
  // Loading guard
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Dashboard View
  // ---------------------------------------------------------------------------
  if (viewMode === "dashboard") {
    const pendingRequests = requests.filter(r => r.status === "PENDING");
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
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-4 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{initials}</span>
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs">Welcome back,</p>
                  <p className="text-white font-semibold">{profile.name || "Advisor"}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-white/60" strokeWidth={2} />
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-[#1A1A2E] border border-white/20 rounded-[60px] shadow-2xl overflow-hidden animate-slideDown">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setViewMode("profile-showcase");
                    }}
                    className="w-full px-6 py-4 text-white hover:bg-white/10 transition-all flex items-center space-x-3 text-left"
                  >
                    <Users className="w-5 h-5 ml-[20px] mr-[12px] my-[0px]" strokeWidth={2} />
                    <span className="font-medium m-[0px]">Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-4 text-red-300 hover:bg-red-500/10 transition-all flex items-center space-x-3 text-left border-t border-white/20"
                  >
                    <LogOut className="w-5 h-5 ml-[20px] mr-[12px] my-[0px]" strokeWidth={2} />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 px-8 py-6 flex space-x-6">
          {/* LEFT — Profile Summary & Availability */}
          <div className="w-80 flex-shrink-0 space-y-6">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <h2 className="text-xl font-bold text-white mb-6">Profile Summary</h2>

              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">{initials}</span>
                </div>
                <h3 className="text-2xl font-bold text-white text-center mb-1">{profile.name}</h3>
                <p className="text-blue-300 text-center mb-1 font-semibold">{profile.title || "—"}</p>
                <p className="text-white/60 text-center mb-3">{profile.department || "—"}</p>
                <p className="text-white/50 text-sm text-center">{profile.email}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Areas of Expertise</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Research Interests</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.researchInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-400/30"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Previously Supervised Projects</span>
                </h4>
                <div className="bg-white/5 rounded-[30px] p-4 max-h-40 overflow-y-auto space-y-2">
                  {profile.previousProjects.map((project, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-white/70 text-xs leading-relaxed">{project}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <h2 className="text-xl font-bold text-white mb-4">Availability Status</h2>
              <p className="text-white/60 text-sm mb-6">
                {isAvailable ? "You are accepting new project requests" : "You are not accepting new requests"}
              </p>

              <button
                onClick={handleAvailabilityToggle}
                className={`w-full h-10 rounded-full transition-all duration-300 relative ${isAvailable ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-white/20"} p-[0px] m-[0px]`}
              >
                <div
                  className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-300 ${isAvailable ? "left-[calc(100%-36px)]" : "left-1"
                    }`}
                />
                <span className={`absolute inset-0 flex items-center font-bold ${isAvailable ? "justify-start pl-4 text-white" : "justify-end text-white/60"} text-[12px] pl-[0px] pr-[16px] py-[0px] mx-[20px] my-[0px]`}>
                  {isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                </span>
              </button>
            </div>
          </div>

          {/* CENTER — Stats & Requests */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Bell className="w-6 h-6 text-yellow-300" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-2">Pending Requests</p>
                <p className="text-white text-4xl font-bold">{stats.pendingRequests}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-300" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-2">Active Projects</p>
                <p className="text-white text-4xl font-bold">{stats.activeProjects}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-300" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-2">Total Students</p>
                <p className="text-white text-4xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>

            <button
              onClick={() => setShowAnnouncementsModal(true)}
              className="w-full px-8 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 rounded-[30px] text-white font-bold text-lg transition-all flex items-center justify-center space-x-3"
            >
              <Bell className="w-5 h-5" strokeWidth={2.5} />
              <span>View Announcements</span>
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Incoming Project Requests</h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{request.project.title}</h3>
                        <div className="flex items-center space-x-3">
                          <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                            {request.project.category?.name ?? "Uncategorized"}
                          </span>
                          <span className="text-white/50 text-sm flex items-center space-x-2">
                            <Calendar className="w-4 h-4" strokeWidth={2} />
                            <span>{formatDate(request.createdAt)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-white/70 mb-4 line-clamp-2">{request.project.description}</p>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2 text-white/60">
                        <Users className="w-5 h-5" strokeWidth={2} />
                        <span className="text-sm font-medium">
                          {request.project.teamMembers.length} member{request.project.teamMembers.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-white/60">
                        <DollarSign className="w-5 h-5" strokeWidth={2} />
                        <span className="text-sm font-medium">{request.project.budget ?? "—"}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleViewProjectDetails(request)}
                        className="flex-1 px-6 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-[30px] font-bold transition-all shadow-lg hover:shadow-xl"
                      >
                        View Project Details
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="px-6 py-4 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold transition-all"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-[30px] font-bold transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}

                {pendingRequests.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-white/50 text-lg">No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Ongoing Projects */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <h2 className="text-xl font-bold text-white mb-6">Ongoing Projects</h2>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {advisedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/10 border border-white/20 rounded-[30px] p-5 hover:bg-white/20 transition-all"
                  >
                    <h4 className="text-white font-semibold mb-2 text-sm">{project.title}</h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/50 text-xs flex items-center space-x-1">
                        <Users className="w-3 h-3" strokeWidth={2} />
                        <span>{project.teamMembers.length} members</span>
                      </span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30">
                        {humanizeProjectStatus(project.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewOngoingDetails(project)}
                      className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-medium transition-all flex items-center justify-center space-x-1"
                    >
                      <FileText className="w-3 h-3" strokeWidth={2} />
                      <span>Details</span>
                    </button>
                  </div>
                ))}

                {advisedProjects.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-6">No active projects yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Modal */}
        {showAnnouncementsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Global Announcements</h2>
                  <p className="text-white/60">Stay updated with the latest news and updates</p>
                </div>
                <button
                  onClick={() => setShowAnnouncementsModal(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={2} />
                </button>
              </div>

              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/20 p-8 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white">{announcement.title}</h3>
                      <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                        {announcement.category}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mb-4">{formatDate(announcement.createdAt)}</p>
                    <p className="text-white/70 leading-relaxed">{announcement.content}</p>
                  </div>
                ))}

                {announcements.length === 0 && (
                  <p className="text-white/50 text-center py-6">No announcements yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Project Detail Modal */}
        {showProjectDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">{selectedRequest.project.title}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                      {selectedRequest.project.category?.name ?? "Uncategorized"}
                    </span>
                    <span className="text-white/60 text-sm">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectDetailModal(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={2} />
                </button>
              </div>

              <div className="mb-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Description</h3>
                  <p className="text-white/70 text-base leading-relaxed">{selectedRequest.project.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Budget</h3>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-300" strokeWidth={2} />
                    <span className="text-white text-xl font-bold">{selectedRequest.project.budget ?? "—"}</span>
                  </div>
                </div>

                {selectedRequest.project.requiredSkills?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white/80 mb-3">Required Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.project.requiredSkills.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.message && (
                  <div>
                    <h3 className="text-lg font-semibold text-white/80 mb-3">Message from Student</h3>
                    <p className="text-white/70 leading-relaxed">{selectedRequest.message}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-4">Team Members ({selectedRequest.project.teamMembers.length})</h3>
                  <div className="space-y-3">
                    {selectedRequest.project.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20"
                      >
                        <div>
                          <p className="text-white font-semibold">{member.user.name}</p>
                          <p className="text-white/50 text-sm">{member.user.email}</p>
                        </div>
                        <span className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30">
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleAcceptRequest(selectedRequest.id)}
                  className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Check className="w-6 h-6" strokeWidth={2} />
                  <span>Accept Request</span>
                </button>
                <button
                  onClick={() => handleRejectRequest(selectedRequest.id)}
                  className="flex-1 px-8 py-5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2"
                >
                  <X className="w-6 h-6" strokeWidth={2} />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ongoing Project Details Modal */}
        {showOngoingDetailModal && selectedOngoingProject && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">{selectedOngoingProject.title}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                      {selectedOngoingProject.category?.name ?? "Uncategorized"}
                    </span>
                    <span className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30">
                      {humanizeProjectStatus(selectedOngoingProject.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowOngoingDetailModal(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={2} />
                </button>
              </div>

              <div className="mb-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Budget</h3>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-300" strokeWidth={2} />
                    <span className="text-white text-xl font-bold">{selectedOngoingProject.budget ?? "—"}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-4">Team Members ({selectedOngoingProject.teamMembers.length})</h3>
                  <div className="space-y-3">
                    {selectedOngoingProject.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20"
                      >
                        <div>
                          <p className="text-white font-semibold">{member.user.name}</p>
                          <p className="text-white/50 text-sm">{member.user.email}</p>
                        </div>
                        <span className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30">
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowOngoingDetailModal(false)}
                className="w-full px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Profile Showcase View
  // ---------------------------------------------------------------------------
  if (viewMode === "profile-showcase") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

        <div className="relative z-10 min-h-screen px-8 py-16">
          <button
            onClick={() => setViewMode("dashboard")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-semibold transition-all mx-[0px] mt-[-30px] mb-[32px]"
          >
            ← Back to Dashboard
          </button>

          <div className="absolute top-8 right-8 flex mx-[0px] my-[-40px]">
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center px-[24px] py-[20px] ml-[0px] mr-[16px] my-[40px]"
            >
              <Edit3 className="w-4 h-4" strokeWidth={2.5} />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-full font-bold transition-all flex items-center px-[24px] py-[20px] mx-[0px] my-[40px]"
            >
              <LogOut className="w-4 h-4" strokeWidth={2.5} />
              <span>Log Out</span>
            </button>
          </div>

          <div className="max-w-7xl mx-auto mt-16">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-1">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] text-center px-[0px] py-[40px] mx-[0px] my-[-40px]">
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <span className="text-white font-bold text-6xl">{initials}</span>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-3">{profile.name}</h1>
                  <p className="text-2xl text-blue-300 mb-2 font-semibold">{profile.title || "—"}</p>
                  <p className="text-xl text-white/60 mb-4">{profile.department || "—"}</p>
                  <p className="text-white/50">{profile.email}</p>
                </div>
              </div>

              <div className="col-span-2 space-y-6">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-[40px] mx-[0px] mt-[-40px] mb-[24px]">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <Target className="w-6 h-6 text-blue-300" />
                    <span>Areas of Expertise</span>
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {profile.expertise.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-5 py-3 bg-blue-500/20 text-blue-200 rounded-full text-base border border-blue-400/30 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <BookOpen className="w-6 h-6 text-purple-300" />
                    <span>Research Interests</span>
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {profile.researchInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-5 py-3 bg-purple-500/20 text-purple-200 rounded-full text-base border border-purple-400/30 font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <GraduationCap className="w-6 h-6 text-yellow-300" />
                    <span>Supervision History</span>
                  </h2>
                  <div className="space-y-3">
                    {profile.previousProjects.map((project, idx) => (
                      <div key={idx} className="flex items-start space-x-3 px-6 py-4 bg-white/5 rounded-[30px]">
                        <CheckCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <p className="text-white/80 leading-relaxed">{project}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-4xl font-bold text-white">Edit Profile</h2>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={2} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    disabled
                    className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-[30px] text-white/60 placeholder-white/40 focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-white/40 text-xs mt-2 ml-2">Email cannot be changed here.</p>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Expertise (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.expertise.join(", ")}
                    onChange={(e) => setEditFormData({ ...editFormData, expertise: e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0) })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Research Interests (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.researchInterests.join(", ")}
                    onChange={(e) => setEditFormData({ ...editFormData, researchInterests: e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0) })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Previously Supervised Projects (one per line)</label>
                  <textarea
                    rows={5}
                    value={editFormData.previousProjects.join("\n")}
                    onChange={(e) => setEditFormData({ ...editFormData, previousProjects: e.target.value.split("\n").map(s => s.trim()).filter(s => s.length > 0) })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setShowEditProfileModal(false)}
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

  return null;
}
