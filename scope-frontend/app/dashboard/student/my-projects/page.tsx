"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Users, CheckCircle, Clock, X, Check, Trash2, Edit3, DollarSign, LogOut, Megaphone,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — set NEXT_PUBLIC_API_URL=http://localhost:5000 (no /api suffix)
// in .env.local. Endpoints in this file prepend /api explicitly to match the
// pattern used in app/dashboard/student/profile/page.tsx.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma (Project + relations)
// -----------------------------------------------------------------------------
type ProjectStatus =
  | "DRAFT"
  | "PENDING_ADVISOR"
  | "ADVISOR_ASSIGNED"
  | "IN_PROGRESS"
  | "REVIEW_PHASE"
  | "COMPLETED";

interface Category {
  id: string;
  name: string;
}

interface TeamMemberDTO {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { name: string; email: string };
}

interface TeamAdDTO {
  id: string;
  title: string;
}

interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  requiredSkills: string[];
  status: ProjectStatus;
  categoryId: string;
  ownerId: string;
  advisorId: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
  advisor: { name: string } | null;
  teamMembers: TeamMemberDTO[];
  // Presence of a teamAd row = project is published on the Team Ads feed.
  // Backend getMyProjects already includes this; null when not published.
  teamAd: TeamAdDTO | null;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Decode the JWT payload client-side to read the current user's id.
 *  This is NOT signature verification — the server still verifies on every call.
 *  We only need `userId` locally to compute "am I the owner?" UI state. */
function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const decoded = JSON.parse(json) as { userId?: string };
    return decoded.userId ?? null;
  } catch {
    return null;
  }
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

function humanizeStatus(s: ProjectStatus): string {
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

/** Buckets a status into the two visual states the current design supports. */
function isAdvisorAssigned(p: ProjectDTO): boolean {
  return p.advisorId !== null && p.status !== "PENDING_ADVISOR" && p.status !== "DRAFT";
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function StudentMyProjectsAdvanced() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(null);
  const [filterType, setFilterType] = useState<"all" | "owned" | "joined">("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    requiredSkills: "",
    budget: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    budget: "",
    requiredSkills: "",
    categoryId: "",
  });

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchProjects = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login/student");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/projects/my-projects`, {
        headers: authHeaders(),
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        router.push("/login/student");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { projects: ProjectDTO[] };
      setProjects(data.projects ?? []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      toast.error("Failed to load your projects");
    }
  }, [router]);

  const fetchCategories = useCallback(async () => {
    try {
      // Public endpoint — no auth required
      const res = await fetch(`${API_URL}/admin/categories`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { categories: Category[] };
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      toast.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchCategories()]);
      setLoading(false);
    })();
  }, [fetchProjects, fetchCategories]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreateProject = async () => {
    // Mirror the server-side Zod rules so users get instant feedback instead
    // of a 400 round-trip. Keep these in sync with project.validator.ts.
    const title = formData.title.trim();
    const description = formData.description.trim();
    const budget = formData.budget.trim();

    if (!title || title.length < 5) {
      toast.error("Title must be at least 5 characters long");
      return;
    }
    if (title.length > 100) {
      toast.error("Title must not exceed 100 characters");
      return;
    }
    if (!description || description.length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!budget) {
      toast.error("Budget is required");
      return;
    }

    setSubmitting(true);
    try {
      const skills = formData.requiredSkills
        .split(",").map(s => s.trim()).filter(s => s.length > 0);

      if (skills.length === 0) {
        toast.error("Please add at least one required skill");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title,
          description,
          budget,
          categoryId: formData.categoryId,
          requiredSkills: skills,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      toast.success("Project Created Successfully!", {
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });

      setShowCreateModal(false);
      setFormData({ title: "", description: "", categoryId: "", requiredSkills: "", budget: "" });
      await fetchProjects();
    } catch (err) {
      console.error("Create project failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProject = (project: ProjectDTO) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleRemoveUser = async (memberUserId: string) => {
    if (!selectedProject) return;
    try {
      const res = await fetch(
        `${API_URL}/projects/${selectedProject.id}/members/${memberUserId}`,
        { method: "DELETE", headers: authHeaders() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const updated: ProjectDTO = {
        ...selectedProject,
        teamMembers: selectedProject.teamMembers.filter(m => m.userId !== memberUserId),
      };
      setProjects(projects.map(p => (p.id === updated.id ? updated : p)));
      setSelectedProject(updated);
      toast.success("Team member removed successfully!");
    } catch (err) {
      console.error("Remove member failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handlePublishTeamAd = async (project: ProjectDTO) => {
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/team-ad`, {
        method: "POST",
        headers: authHeaders(),
        // Body intentionally empty — backend defaults title/description/etc.
        // from the project itself. Pass `fullDescription`/`technicalSkills`
        // here later if we add a publish-customization form.
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { teamAd: TeamAdDTO };
      // Patch local state so the badge flips immediately without a round-trip.
      const patched: ProjectDTO = { ...project, teamAd: data.teamAd };
      setProjects(prev => prev.map(p => (p.id === project.id ? patched : p)));
      if (selectedProject?.id === project.id) setSelectedProject(patched);
      toast.success("Project published to Team Ads", {
        description: "Other students can now find and apply to your project.",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Publish team ad failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to publish team ad");
    }
  };

  const handleUnpublishTeamAd = async (project: ProjectDTO) => {
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/team-ad`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const patched: ProjectDTO = { ...project, teamAd: null };
      setProjects(prev => prev.map(p => (p.id === project.id ? patched : p)));
      if (selectedProject?.id === project.id) setSelectedProject(patched);
      toast.success("Project unpublished from Team Ads");
    } catch (err) {
      console.error("Unpublish team ad failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to unpublish team ad");
    }
  };

  const handleLeaveProject = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`${API_URL}/projects/${selectedProject.id}/leave`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setShowProjectModal(false);
      setSelectedProject(null);
      toast.success("You have left the project");
    } catch (err) {
      console.error("Leave project failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to leave project");
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`${API_URL}/projects/${selectedProject.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setShowProjectModal(false);
      setSelectedProject(null);
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Delete project failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: string) => {
    if (!selectedProject) return;

    // Optimistic update so the <select> snaps instantly.
    const previous = selectedProject;
    const optimistic: ProjectDTO = {
      ...selectedProject,
      teamMembers: selectedProject.teamMembers.map(m =>
        m.userId === memberUserId ? { ...m, role: newRole } : m
      ),
    };
    setSelectedProject(optimistic);
    setProjects(projects.map(p => (p.id === optimistic.id ? optimistic : p)));

    try {
      const res = await fetch(
        `${API_URL}/projects/${selectedProject.id}/members/${memberUserId}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Update role failed:", err);
      // Roll back optimistic update
      setSelectedProject(previous);
      setProjects(projects.map(p => (p.id === previous.id ? previous : p)));
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleEditProject = (project: ProjectDTO) => {
    setSelectedProject(project);
    setEditFormData({
      title: project.title,
      description: project.description,
      budget: project.budget ?? "",
      requiredSkills: project.requiredSkills.join(", "),
      categoryId: project.categoryId,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      const skills = editFormData.requiredSkills
        .split(",").map(s => s.trim()).filter(s => s.length > 0);

      const res = await fetch(`${API_URL}/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          budget: editFormData.budget,
          requiredSkills: skills,
          categoryId: editFormData.categoryId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { project: ProjectDTO };
      // Merge with relations we already had loaded (server includes some but
      // not all; fetchProjects() refresh keeps everything in sync).
      setProjects(projects.map(p => (p.id === selectedProject.id ? { ...p, ...data.project } : p)));
      setShowEditModal(false);
      setSelectedProject(null);

      toast.success("Project Updated!", {
        description: "Your project and linked team ad have been updated successfully.",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });

      await fetchProjects();
    } catch (err) {
      console.error("Update project failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived UI state
  // ---------------------------------------------------------------------------
  const filteredProjects = projects.filter(p => {
    const owns = currentUserId ? p.ownerId === currentUserId : false;
    if (filterType === "owned") return owns;
    if (filterType === "joined") return !owns;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-8">
      <Toaster position="bottom-right" />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
          <p className="text-white/60 text-lg">Manage and track your project portfolio</p>
        </div>

        {/* Create Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-3 px-8 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          <span>Create Project</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="mb-8 flex justify-center">
        <div className="flex space-x-3">
          <button
            onClick={() => setFilterType("all")}
            className={`px-6 py-3 backdrop-blur-sm rounded-full text-sm font-medium border transition-all cursor-pointer ${filterType === "all"
                ? "bg-blue-500/30 text-blue-200 border-blue-400/50 shadow-lg"
                : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
              }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setFilterType("owned")}
            className={`px-6 py-3 backdrop-blur-sm rounded-full text-sm font-medium border transition-all cursor-pointer ${filterType === "owned"
                ? "bg-blue-500/30 text-blue-200 border-blue-400/50 shadow-lg"
                : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
              }`}
          >
            Projects I Own
          </button>
          <button
            onClick={() => setFilterType("joined")}
            className={`px-6 py-3 backdrop-blur-sm rounded-full text-sm font-medium border transition-all cursor-pointer ${filterType === "joined"
                ? "bg-blue-500/30 text-blue-200 border-blue-400/50 shadow-lg"
                : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
              }`}
          >
            Projects I Joined
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">Loading your projects...</p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const isOwner = currentUserId === project.ownerId;
            const assigned = isAdvisorAssigned(project);
            return (
              <div
                key={project.id}
                className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-5 py-2 backdrop-blur-sm rounded-full text-sm font-medium border ${assigned
                          ? "bg-green-500/20 text-green-200 border-green-400/30"
                          : "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
                        }`}
                    >
                      {assigned ? (
                        <span className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>{humanizeStatus(project.status)}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{humanizeStatus(project.status)}</span>
                        </span>
                      )}
                    </span>
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                      {project.category?.name ?? "Uncategorized"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => handleEditProject(project)}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-full text-xs border border-blue-400/30 font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {project.teamAd ? (
                          <button
                            onClick={() => handleUnpublishTeamAd(project)}
                            title="Click to remove this project from the Team Ads feed"
                            className="px-3 py-2 bg-green-500/20 hover:bg-red-500/30 text-green-200 hover:text-red-200 rounded-full text-xs border border-green-400/30 hover:border-red-400/30 font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <Megaphone className="w-3 h-3" />
                            <span>Published</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishTeamAd(project)}
                            title="Publish this project so other students can apply"
                            className="px-3 py-2 bg-white/10 hover:bg-purple-500/30 text-white/70 hover:text-purple-200 rounded-full text-xs border border-white/20 hover:border-purple-400/30 font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <Megaphone className="w-3 h-3" />
                            <span>Publish</span>
                          </button>
                        )}
                        <span className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-400/30 font-semibold">
                          Owner
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4">{project.title}</h3>

                {/* Description */}
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  {project.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2 text-white/60">
                    <Users className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium">
                      {project.teamMembers.length} member{project.teamMembers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/60">
                    <DollarSign className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium">{project.budget ?? "—"}</span>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => handleViewProject(project)}
                  className="w-full px-6 py-4 bg-white/90 hover:bg-white border border-white/20 text-gray-900 rounded-[30px] font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg mb-6">No projects found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span>Create Your First Project</span>
          </button>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectModal && selectedProject && (() => {
        const isOwner = currentUserId === selectedProject.ownerId;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">{selectedProject.title}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                      {selectedProject.category?.name ?? "Uncategorized"}
                    </span>
                    <span className="text-white/60 text-sm">Created {formatDate(selectedProject.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={2} />
                </button>
              </div>

              {/* Project Info */}
              <div className="mb-8 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Description</h3>
                  <p className="text-white/70 text-base leading-relaxed">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Budget */}
                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Budget</h3>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-300" strokeWidth={2} />
                    <span className="text-white text-xl font-bold">{selectedProject.budget ?? "—"}</span>
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white/80 mb-4">Team Members ({selectedProject.teamMembers.length})</h3>
                <div className="space-y-3">
                  {selectedProject.teamMembers.map((member) => {
                    const isSelf = member.userId === currentUserId;
                    const isOwnerMember = member.userId === selectedProject.ownerId;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20"
                      >
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {member.user.name}{isSelf ? " (You)" : ""}
                          </p>
                          <p className="text-white/50 text-sm">{member.user.email}</p>
                        </div>

                        {isOwner ? (
                          <div className="flex items-center space-x-3">
                            {/* Role Selector for Owner */}
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                              className="px-4 py-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                            >
                              <option value="Project Lead" className="bg-gray-800">Project Lead</option>
                              <option value="Frontend Developer" className="bg-gray-800">Frontend Developer</option>
                              <option value="Backend Developer" className="bg-gray-800">Backend Developer</option>
                              <option value="ML Engineer" className="bg-gray-800">ML Engineer</option>
                              <option value="Designer" className="bg-gray-800">Designer</option>
                              <option value="DevOps" className="bg-gray-800">DevOps</option>
                            </select>

                            {/* Remove Button (cannot remove the owner) */}
                            {!isOwnerMember && (
                              <button
                                onClick={() => handleRemoveUser(member.userId)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full border border-red-400/30 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-300" strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm border border-white/20">
                            {member.role}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {isOwner ? (
                  <button
                    onClick={handleDeleteProject}
                    className="flex-1 px-8 py-5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2} />
                    <span>Delete Project</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLeaveProject}
                    className="flex-1 px-8 py-5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 text-orange-300 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={2} />
                    <span>Leave Project</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-4xl font-bold text-white">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Create Form */}
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
              {/* Project Title */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., AI-Powered Study Assistant"
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg"
                  required
                />
              </div>

              {/* Category — populated from /api/admin/categories */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange("categoryId", e.target.value)}
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg cursor-pointer"
                  required
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-800">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Budget *
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  placeholder="e.g., 15,000 TL"
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg"
                  required
                />
                <p className="text-white/50 text-xs mt-2 ml-2">Enter the estimated project budget</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Description *
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your project idea, goals, and expected outcomes..."
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 resize-none transition-all text-lg"
                  required
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Required Skills
                </label>
                <input
                  type="text"
                  value={formData.requiredSkills}
                  onChange={(e) => handleInputChange("requiredSkills", e.target.value)}
                  placeholder="e.g., Python, React, Machine Learning"
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg"
                />
                <p className="text-white/50 text-xs mt-2 ml-2">Separate skills with commas</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-5 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-8 py-5 bg-white/10 border border-white/30 text-white rounded-[30px] font-semibold text-lg hover:bg-white/20 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-8 py-5 bg-white hover:bg-white/95 text-gray-900 rounded-[30px] font-bold text-lg transition-all shadow-2xl hover:shadow-xl flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                  <span>{submitting ? "Creating..." : "Create Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-4xl font-bold text-white">Edit Project</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Edit Form */}
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              {/* Project Title */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g., AI-Powered Study Assistant"
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Category *
                </label>
                <select
                  value={editFormData.categoryId}
                  onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg cursor-pointer"
                  required
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-800">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Budget *
                </label>
                <input
                  type="text"
                  value={editFormData.budget}
                  onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                  placeholder="e.g., 15,000 TL"
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg"
                  required
                />
                <p className="text-white/50 text-xs mt-2 ml-2">Enter the estimated project budget</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Description *
                </label>
                <textarea
                  rows={6}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Describe your project idea, goals, and expected outcomes..."
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 resize-none transition-all text-lg"
                  required
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Required Skills
                </label>
                <input
                  type="text"
                  value={editFormData.requiredSkills}
                  onChange={(e) => setEditFormData({ ...editFormData, requiredSkills: e.target.value })}
                  placeholder="e.g., Python, React, Machine Learning"
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg"
                />
                <p className="text-white/50 text-xs mt-2 ml-2">Separate skills with commas</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-5 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-8 py-5 bg-white/10 border border-white/30 text-white rounded-[30px] font-semibold text-lg hover:bg-white/20 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-8 py-5 bg-white hover:bg-white/95 text-gray-900 rounded-[30px] font-bold text-lg transition-all shadow-2xl hover:shadow-xl flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                  <span>{submitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
