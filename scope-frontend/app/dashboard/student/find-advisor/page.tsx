"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Send, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); endpoints below prepend
// /api explicitly to stay consistent with the rest of the app.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma
// -----------------------------------------------------------------------------
type AdvisorAvailability = "available" | "unavailable";

interface AdvisorDTO {
  id: string;
  name: string;
  email: string;
  advisorProfile: {
    title: string | null;
    department: string | null;
    isAvailable: boolean;
    expertise: string[];
    researchInterests: string[];
  } | null;
}

interface AdvisorRequestSummary {
  id: string;
  advisorId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
}

interface MyProjectDTO {
  id: string;
  title: string;
  status: string;
  ownerId: string;
  advisorRequests: AdvisorRequestSummary[];
}

// UI-shaped advisor for rendering
interface AdvisorVM {
  id: string;
  name: string;
  title: string;
  department: string;
  expertise: string[];
  availability: AdvisorAvailability;
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

function humanizeStatus(s: string): string {
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

function toAdvisorVM(a: AdvisorDTO): AdvisorVM {
  const p = a.advisorProfile;
  return {
    id: a.id,
    name: a.name,
    title: p?.title ?? "—",
    department: p?.department ?? "—",
    expertise: p?.expertise ?? [],
    // Backend AdvisorProfile.isAvailable is a boolean; the design supports a
    // third "limited" state that we have no data source for, so we collapse
    // to a clean binary mapping.
    availability: p?.isAvailable ? "available" : "unavailable",
  };
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function StudentFindAdvisor() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorVM | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [advisors, setAdvisors] = useState<AdvisorVM[]>([]);
  const [myProjects, setMyProjects] = useState<MyProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------
  const fetchAdvisors = useCallback(async () => {
    const res = await fetch(`${API_URL}/advisors`, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Advisors fetch failed (${res.status})`);
    const data = (await res.json()) as { advisors: AdvisorDTO[] };
    setAdvisors((data.advisors ?? []).map(toAdvisorVM));
  }, []);

  const fetchMyProjects = useCallback(async () => {
    const res = await fetch(`${API_URL}/projects/my-projects`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`My projects fetch failed (${res.status})`);
    const data = (await res.json()) as { projects: MyProjectDTO[] };
    // Only projects the student OWNS can be sent to an advisor; team-only
    // memberships can't initiate an advisor request.
    setMyProjects((data.projects ?? []).filter(p => p.ownerId === currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login/student");
      return;
    }
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchAdvisors(), fetchMyProjects()]);
      } catch (err) {
        console.error("Find-advisor load failed:", err);
        const message = err instanceof Error ? err.message : "Failed to load data";
        if (/401|403/.test(message)) {
          localStorage.removeItem("token");
          router.push("/login/student");
          return;
        }
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, fetchAdvisors, fetchMyProjects]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  // Expertise chip list — derived from the union of every advisor's expertise
  // so the filter actually reflects what's in the DB instead of a stale hardcoded list.
  const expertiseOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of advisors) for (const exp of a.expertise) set.add(exp);
    return Array.from(set).sort();
  }, [advisors]);

  const filteredAdvisors = useMemo(() => advisors.filter(advisor => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" ||
      advisor.name.toLowerCase().includes(q) ||
      advisor.department.toLowerCase().includes(q) ||
      advisor.expertise.some(exp => exp.toLowerCase().includes(q));
    const matchesExpertise = selectedExpertise.length === 0 ||
      selectedExpertise.some(exp => advisor.expertise.includes(exp));
    const matchesAvailability = !availableOnlyFilter || advisor.availability === "available";
    return matchesSearch && matchesExpertise && matchesAvailability;
  }), [advisors, searchQuery, selectedExpertise, availableOnlyFilter]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const toggleExpertise = (expertise: string) => {
    setSelectedExpertise(prev =>
      prev.includes(expertise) ? prev.filter(e => e !== expertise) : [...prev, expertise]
    );
  };

  const getAvailabilityColor = (status: AdvisorAvailability) => {
    switch (status) {
      case "available": return "bg-green-400";
      case "unavailable": return "bg-red-400";
      default: return "bg-gray-400";
    }
  };

  const getAvailabilityText = (status: AdvisorAvailability) => {
    switch (status) {
      case "available": return "Available";
      case "unavailable": return "Unavailable";
      default: return "Unknown";
    }
  };

  const handleSendRequest = (advisor: AdvisorVM) => {
    setSelectedAdvisor(advisor);
    setSelectedProject(null);
    setShowRequestModal(true);
  };

  const hasRequestToAdvisor = (project: MyProjectDTO, advisorId: string): boolean => {
    return project.advisorRequests.some(r => r.advisorId === advisorId);
  };

  const handleSubmitRequest = async () => {
    if (myProjects.length === 0) {
      setShowRequestModal(false);
      toast.error("No Projects Found", {
        description: "Please create a project first before sending advisor requests.",
        duration: 4000,
        className: "bg-red-500/90 backdrop-blur-xl text-white border-red-400/50",
      });
      return;
    }

    if (!selectedProject || !selectedAdvisor) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/advisors/request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          projectId: selectedProject,
          advisorId: selectedAdvisor.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const advisorName = selectedAdvisor.name;
      setShowRequestModal(false);
      setSelectedProject(null);
      setSelectedAdvisor(null);

      // Refresh my-projects so the "Request Already Sent" badge appears next time.
      await fetchMyProjects();

      toast.success("Request Sent!", {
        description: `Your request has been sent to ${advisorName}.`,
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Send advisor request failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Toaster position="bottom-right" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Find Advisor</h1>
        <p className="text-white/60 text-lg">Connect with faculty advisors for your projects</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search advisors by name, department, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all text-lg"
            />
          </div>

          {/* Available Toggle Filter */}
          <div className="flex items-center space-x-3 px-6 py-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px]">
            <span className="text-white/70 text-sm font-semibold">Available Only</span>
            <button
              onClick={() => setAvailableOnlyFilter(!availableOnlyFilter)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                availableOnlyFilter
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                  : "bg-white/20"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  availableOnlyFilter ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expertise Filters */}
      {expertiseOptions.length > 0 && (
        <div className="mb-8">
          <p className="text-white/70 text-sm font-semibold mb-3 ml-2">Filter by Expertise</p>
          <div className="flex flex-wrap gap-3">
            {expertiseOptions.map((expertise) => (
              <button
                key={expertise}
                onClick={() => toggleExpertise(expertise)}
                className={`px-5 py-3 backdrop-blur-sm rounded-full text-sm font-medium border transition-all ${
                  selectedExpertise.includes(expertise)
                    ? "bg-blue-500/30 text-blue-200 border-blue-400/50 shadow-lg"
                    : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                }`}
              >
                {expertise}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advisors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAdvisors.map((advisor) => (
            <motion.div
              key={advisor.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-300"
            >
              {/* Availability Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${getAvailabilityColor(advisor.availability)} rounded-full shadow-lg`}></div>
                  <span className="text-white/70 text-sm font-medium">{getAvailabilityText(advisor.availability)}</span>
                </div>
              </div>

              {/* Advisor Info */}
              <h3 className="text-2xl font-bold text-white mb-2">{advisor.name}</h3>
              <p className="text-white/60 text-base mb-1">{advisor.title}</p>
              <p className="text-white/50 text-sm mb-6">{advisor.department}</p>

              {/* Expertise Tags */}
              <div className="mb-6">
                <p className="text-white/60 text-sm font-semibold mb-3">Expertise:</p>
                <div className="flex flex-wrap gap-2">
                  {advisor.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Send Request Button */}
              <button
                onClick={() => handleSendRequest(advisor)}
                disabled={advisor.availability === "unavailable"}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-[30px] font-semibold transition-all ${
                  advisor.availability === "unavailable"
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white/90 hover:bg-white text-gray-900 shadow-lg hover:shadow-xl cursor-pointer"
                }`}
              >
                <Send className="w-4 h-4" strokeWidth={2} />
                <span>Send Request</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAdvisors.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">No advisors found matching your criteria</p>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedAdvisor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Select Project</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Advisor Info */}
            <div className="mb-8 p-6 bg-white/10 rounded-[40px] border border-white/20">
              <p className="text-white/60 text-sm mb-2">Sending request to:</p>
              <h3 className="text-xl font-bold text-white">{selectedAdvisor.name}</h3>
              <p className="text-white/50 text-sm mt-1">{selectedAdvisor.title}, {selectedAdvisor.department}</p>
            </div>

            {/* Project Selection */}
            {myProjects.length > 0 ? (
              <>
                <div className="mb-8">
                  <p className="text-white/80 text-sm font-semibold mb-4 ml-2">Choose a project for this advisor:</p>
                  <div className="space-y-3">
                    {myProjects.map((project) => {
                      const alreadyRequested = hasRequestToAdvisor(project, selectedAdvisor.id);
                      return (
                        <label
                          key={project.id}
                          className={`flex items-center space-x-4 px-6 py-4 rounded-[30px] border transition-all ${
                            alreadyRequested
                              ? "bg-white/5 border-white/10 cursor-not-allowed opacity-60"
                              : "bg-white/10 hover:bg-white/15 border-white/20 cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="project"
                            checked={selectedProject === project.id}
                            onChange={() => !alreadyRequested && setSelectedProject(project.id)}
                            disabled={alreadyRequested}
                            className="w-5 h-5 accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-white text-lg font-medium">{project.title}</span>
                              {alreadyRequested && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-400/30 flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Request Already Sent</span>
                                </span>
                              )}
                            </div>
                            <p className="text-white/50 text-sm mt-1">{humanizeStatus(project.status)}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitRequest}
                  disabled={!selectedProject || submitting}
                  className={`w-full px-8 py-5 rounded-[30px] font-bold text-lg transition-all ${
                    selectedProject && !submitting
                      ? "bg-white hover:bg-white/95 text-gray-900 shadow-2xl hover:shadow-xl cursor-pointer"
                      : "bg-white/20 text-white/40 cursor-not-allowed"
                  }`}
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-300" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Projects Found</h3>
                <p className="text-white/70 text-lg mb-8">Please create a project first before sending advisor requests.</p>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-8 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
