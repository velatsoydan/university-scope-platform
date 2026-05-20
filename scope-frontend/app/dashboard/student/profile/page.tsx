"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit3, X, Check, LogOut, Globe, GraduationCap, BookOpen, FolderKanban,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); we append /api per call,
// matching the convention used in the rest of the app.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma (User + StudentProfile + Project)
// -----------------------------------------------------------------------------
interface StudentProfileDTO {
  year: string | null;
  department: string | null;
  bio: string | null;
  education: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  technicalSkills: string[];
  interests: string[];
}

interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentProfile: StudentProfileDTO | null;
  };
}

type ProjectStatus =
  | "DRAFT" | "PENDING_ADVISOR" | "ADVISOR_ASSIGNED"
  | "IN_PROGRESS" | "REVIEW_PHASE" | "COMPLETED";

interface MyProjectDTO {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  teamMembers: Array<{ userId: string; role: string }>;
}

// UI-shaped pieces — empty strings/arrays mean "not set yet"; we render
// fallbacks at display time instead of persisting placeholder text.
interface StudentVM {
  fullName: string;
  email: string;
  year: string;
  department: string;
  technicalSkills: string[];
  interests: string[];
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  education: string;
}

interface ProjectHistoryVM {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Completed";
  role: string;
}

interface EditFormData {
  fullName: string;
  email: string;
  year: string;
  department: string;
  technicalSkills: string; // comma-separated string while editing
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  education: string;
}

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

/** Decode the JWT payload client-side to read the current user's id.
 *  Server still verifies on every call — this is only used to pick the
 *  caller's TeamMember row when computing project role. */
function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(atob(base64)) as { userId?: string }).userId ?? null;
  } catch {
    return null;
  }
}

function projectStatusBucket(s: ProjectStatus): "Active" | "Completed" {
  return s === "COMPLETED" ? "Completed" : "Active";
}

function initialsOf(name: string): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0] ?? "").join("").slice(0, 3) || "?";
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function StudentProfile() {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [studentData, setStudentData] = useState<StudentVM | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [projectHistory, setProjectHistory] = useState<ProjectHistoryVM[]>([]);

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login/student");
      return;
    }
    const res = await fetch(`${API_URL}/users/me`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      router.push("/login/student");
      return;
    }
    if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);

    const data = (await res.json()) as MeResponse;
    const profile = data.user.studentProfile;
    const vm: StudentVM = {
      fullName: data.user.name,
      email: data.user.email,
      year: profile?.year ?? "",
      department: profile?.department ?? "",
      technicalSkills: profile?.technicalSkills ?? [],
      interests: profile?.interests ?? [],
      bio: profile?.bio ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      githubUrl: profile?.githubUrl ?? "",
      education: profile?.education ?? "",
    };
    setStudentData(vm);
    setEditFormData({
      fullName: vm.fullName,
      email: vm.email,
      year: vm.year,
      department: vm.department,
      technicalSkills: vm.technicalSkills.join(", "),
      bio: vm.bio,
      linkedinUrl: vm.linkedinUrl,
      githubUrl: vm.githubUrl,
      education: vm.education,
    });
  }, [router]);

  const fetchProjects = useCallback(async () => {
    const res = await fetch(`${API_URL}/projects/my-projects`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`Projects fetch failed (${res.status})`);
    const data = (await res.json()) as { projects: MyProjectDTO[] };

    const uid = getCurrentUserId();
    const vms: ProjectHistoryVM[] = (data.projects ?? []).map(p => {
      const isOwner = p.ownerId === uid;
      const membership = p.teamMembers.find(m => m.userId === uid);
      const role = isOwner ? "Project Lead" : (membership?.role ?? "Member");
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: projectStatusBucket(p.status),
        role,
      };
    });
    setProjectHistory(vms);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProfile(), fetchProjects()]);
      } catch (err) {
        console.error("Profile load failed:", err);
        toast.error(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchProfile, fetchProjects]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const handleSaveChanges = async () => {
    if (!editFormData || !studentData) return;
    const token = getToken();
    if (!token) {
      router.push("/login/student");
      return;
    }

    setSaving(true);
    try {
      const skills = editFormData.technicalSkills
        .split(",").map(s => s.trim()).filter(s => s.length > 0);

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          // User table — backend only reads `name` here (email is locked
          // because login/auth keys off it).
          name: editFormData.fullName,
          // StudentProfile fields — Prisma ignores `undefined`, so omitting a
          // field would silently keep the old value; we send every editable
          // field explicitly to avoid that magic.
          year: editFormData.year,
          department: editFormData.department,
          bio: editFormData.bio,
          education: editFormData.education,
          linkedinUrl: editFormData.linkedinUrl,
          githubUrl: editFormData.githubUrl,
          technicalSkills: skills,
          interests: studentData.interests,
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.push("/login/student");
          return;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      // Keep sidebar/topbar in sync if it reads userName from localStorage.
      localStorage.setItem("userName", editFormData.fullName);
      setShowEditModal(false);
      // Re-fetch so the UI reflects exactly what's in the DB.
      await fetchProfile();

      toast.success("Profile Updated!", {
        description: "Your profile has been updated successfully.",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    router.push("/");
  };

  // ---------------------------------------------------------------------------
  // Loading guard
  // ---------------------------------------------------------------------------
  if (loading || !studentData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived display helpers
  // ---------------------------------------------------------------------------
  const yearDeptLine = [studentData.year || null, studentData.department || null]
    .filter(Boolean)
    .join(" • ") || "—";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative min-h-screen">
      <Toaster position="bottom-right" />

      {/* Deep Indigo to Midnight Violet Gradient Background */}
      <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 overflow-hidden">
        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen px-8 py-8">
          {/* Top Action Buttons */}
          <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 rounded-full text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-white/90 hover:bg-white border border-white/20 rounded-full text-gray-900 font-semibold transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <Edit3 className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm">Edit Profile</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-full text-red-300 font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm">Log Out</span>
              </button>
            </div>
          </div>

          {/* Profile Container */}
          <div className="max-w-6xl mx-auto">
            {/* Compact Header Section */}
            <div className="mb-8 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <div className="flex items-center space-x-6">
                {/* Circular Avatar (initials only — file upload not supported by backend) */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl flex-shrink-0">
                  <span className="text-white font-bold text-3xl">
                    {initialsOf(studentData.fullName)}
                  </span>
                </div>

                {/* Name & Contact */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {studentData.fullName || "Student User"}
                  </h1>
                  <p className="text-xl text-white/80 mb-2">{yearDeptLine}</p>
                  <p className="text-sm text-white/60 mb-4">{studentData.email}</p>

                  {/* Social Links — render only what's actually set */}
                  {(studentData.linkedinUrl || studentData.githubUrl) ? (
                    <div className="space-y-2">
                      {studentData.linkedinUrl && (
                        <a
                          href={studentData.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-white/70 hover:text-white transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                            <Globe className="w-4 h-4 text-blue-300" strokeWidth={2} />
                          </div>
                          <span className="text-sm font-medium text-slate-300">
                            {studentData.linkedinUrl.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      )}
                      {studentData.githubUrl && (
                        <a
                          href={studentData.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-white/70 hover:text-white transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                            <Globe className="w-4 h-4 text-purple-300" strokeWidth={2} />
                          </div>
                          <span className="text-sm font-medium text-slate-300">
                            {studentData.githubUrl.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">No social links added yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Technical Skills & Interests */}
              <div className="col-span-1 space-y-6">
                {/* Technical Skills */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-blue-300" />
                    <span>Technical Skills</span>
                  </h2>
                  {studentData.technicalSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {studentData.technicalSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">No skills added yet.</p>
                  )}
                </div>

                {/* Interests */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Interests</h2>
                  {studentData.interests.length > 0 ? (
                    <div className="space-y-2">
                      {studentData.interests.map((interest, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-white/80 text-sm">{interest}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">No interests added yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column - About & Education & Projects */}
              <div className="col-span-2 space-y-6">
                {/* About Me */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-4">About Me</h2>
                  {studentData.bio ? (
                    <p className="text-white/70 leading-relaxed">{studentData.bio}</p>
                  ) : (
                    <p className="text-white/40 leading-relaxed">No bio added yet.</p>
                  )}
                </div>

                {/* Education */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-yellow-300" />
                    <span>Education</span>
                  </h2>
                  {studentData.education ? (
                    <p className="text-white/80">{studentData.education}</p>
                  ) : (
                    <p className="text-white/40">No education info added yet.</p>
                  )}
                </div>

                {/* Project History */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <FolderKanban className="w-5 h-5 text-purple-300" />
                    <span>Project History</span>
                  </h2>
                  {projectHistory.length > 0 ? (
                    <div className="space-y-4">
                      {projectHistory.map((project) => (
                        <div
                          key={project.id}
                          className="bg-white/10 border border-white/20 rounded-[30px] p-6 hover:bg-white/15 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                              <p className="text-white/60 text-sm">{project.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                              project.status === "Active"
                                ? "bg-green-500/20 text-green-200 border border-green-400/30"
                                : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-400/30">
                            {project.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">No projects yet — create or join a project to build your history.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Year</label>
                  <input
                    type="text"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                    placeholder="e.g., 3rd Year"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Department</label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  placeholder="e.g., Computer Engineering"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editFormData.linkedinUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={editFormData.githubUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.technicalSkills}
                  onChange={(e) => setEditFormData({ ...editFormData, technicalSkills: e.target.value })}
                  placeholder="React, Python, Machine Learning"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Education</label>
                <input
                  type="text"
                  value={editFormData.education}
                  onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                  placeholder="e.g., BSc in Computer Engineering, Üsküdar University"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">About Me</label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell others a bit about yourself..."
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all cursor-pointer"
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
