"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); endpoints below prepend
// /api explicitly to stay consistent with the rest of the app.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma (TeamAd + Project + relations)
// -----------------------------------------------------------------------------
type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface TeamAdDTO {
  id: string;
  projectId: string;
  title: string;
  description: string;
  fullDescription: string | null;
  projectType: string | null;
  technicalSkills: string[];
  interests: string[];
  createdAt: string;
  author: { id: string; name: string };
  project: {
    id: string;
    status: string;
    category: { id: string; name: string } | null;
    _count: { teamMembers: number };
    applications: Array<{ id: string; status: ApplicationStatus }>;
  };
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
}

// The UI was originally typed against a strict 4-value union; we relax that and
// just show whatever the DB has, falling back to "General" if the project type
// is null on a particular ad.
function adProjectType(ad: TeamAdDTO): string {
  return ad.projectType ?? ad.project.category?.name ?? "General";
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function StudentTeamAds() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<TeamAdDTO | null>(null);

  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [teamAds, setTeamAds] = useState<TeamAdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Roles a student can request — taxonomy lives in the UI since it isn't
  // enforced by the schema (TeamMember.role and requestedRoles are free-form).
  const rolesOptions = ["Frontend", "Backend", "Designer", "ML Engineer", "DevOps"];

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------
  const fetchTeamAds = useCallback(async () => {
    const res = await fetch(`${API_URL}/team-ads`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`Team ads fetch failed (${res.status})`);
    const data = (await res.json()) as { teamAds: TeamAdDTO[] };
    setTeamAds(data.teamAds ?? []);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login/student");
      return;
    }
    (async () => {
      setLoading(true);
      try {
        await fetchTeamAds();
      } catch (err) {
        console.error("Team ads load failed:", err);
        const message = err instanceof Error ? err.message : "Failed to load team ads";
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
  }, [router, fetchTeamAds]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  // Build filter chips from the union of real data so categories actually
  // match what the DB serves (mirrors the find-advisor convention).
  const projectTypes = useMemo(() => {
    const set = new Set<string>();
    for (const ad of teamAds) set.add(adProjectType(ad));
    return Array.from(set).sort();
  }, [teamAds]);

  const skillsOptions = useMemo(() => {
    const set = new Set<string>();
    for (const ad of teamAds) for (const s of ad.technicalSkills) set.add(s);
    return Array.from(set).sort();
  }, [teamAds]);

  const filteredTeamAds = useMemo(() => teamAds.filter(ad => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" ||
      ad.title.toLowerCase().includes(q) ||
      ad.description.toLowerCase().includes(q) ||
      ad.author.name.toLowerCase().includes(q);
    const matchesProjectType = selectedProjectTypes.length === 0 ||
      selectedProjectTypes.includes(adProjectType(ad));
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => ad.technicalSkills.includes(skill));
    return matchesSearch && matchesProjectType && matchesSkills;
  }), [teamAds, searchQuery, selectedProjectTypes, selectedSkills]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const toggleProjectType = (type: string) => {
    setSelectedProjectTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleApplyClick = (ad: TeamAdDTO) => {
    setSelectedAd(ad);
    setSelectedRoles([]);
    setShowApplyModal(true);
  };

  const hasAppliedToAd = (ad: TeamAdDTO): boolean => {
    return ad.project.applications.length > 0;
  };

  const handleSubmitApplication = async () => {
    if (!selectedAd || selectedRoles.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/applications/apply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          projectId: selectedAd.projectId,
          requestedRoles: selectedRoles,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      setShowApplyModal(false);
      setSelectedAd(null);
      setSelectedRoles([]);

      // Refresh so the "Applied" pill takes effect on the card.
      await fetchTeamAds();

      toast.success("Application Sent Successfully!", {
        description: "The team will review your application soon",
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Apply failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit application");
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
        <h1 className="text-4xl font-bold text-white mb-2">Team Ads</h1>
        <p className="text-white/60 text-lg">Discover team opportunities and join exciting projects</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search team ads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all text-lg"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="mb-8 space-y-4">
        {projectTypes.length > 0 && (
          <div>
            <p className="text-white/70 text-sm font-semibold mb-3 ml-2">Project Type</p>
            <div className="flex flex-wrap gap-3">
              {projectTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleProjectType(type)}
                  className={`px-5 py-3 backdrop-blur-sm rounded-full text-sm font-medium border transition-all cursor-pointer ${selectedProjectTypes.includes(type)
                    ? "bg-blue-500/30 text-blue-200 border-blue-400/50 shadow-lg"
                    : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {skillsOptions.length > 0 && (
          <div>
            <p className="text-white/70 text-sm font-semibold mb-3 ml-2">Required Skills</p>
            <div className="flex flex-wrap gap-3">
              {skillsOptions.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-5 py-3 backdrop-blur-sm rounded-full text-sm font-medium border transition-all cursor-pointer ${selectedSkills.includes(skill)
                    ? "bg-purple-500/30 text-purple-200 border-purple-400/50 shadow-lg"
                    : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                    }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        {filteredTeamAds.map((ad) => {
          const isExpanded = expandedCard === ad.id;
          const alreadyApplied = hasAppliedToAd(ad);

          return (
            <div
              key={ad.id}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-500 ease-in-out"
              style={{
                maxHeight: isExpanded ? "1200px" : "380px",
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-5 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-200 rounded-full text-sm font-medium border border-blue-400/30">
                    {adProjectType(ad)}
                  </span>
                  <span className="text-white/50 text-sm">by {ad.author.name}</span>
                </div>
                <span className="text-white/50 text-sm">{formatDate(ad.createdAt)}</span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4">{ad.title}</h3>

              {/* Description */}
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                {isExpanded ? (ad.fullDescription ?? ad.description) : ad.description}
              </p>

              {/* Skills Tags */}
              {isExpanded && ad.technicalSkills.length > 0 && (
                <div className="mb-6">
                  <p className="text-white/60 text-sm font-semibold mb-3">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {ad.technicalSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleExpand(ad.id)}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-semibold transition-all cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                      <span>View Details</span>
                    </>
                  )}
                </button>

                {isExpanded && (
                  alreadyApplied ? (
                    <button
                      disabled
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-500/30 border border-blue-400/50 text-blue-200 rounded-full font-bold cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      <span>Applied</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyClick(ad)}
                      className="flex items-center space-x-2 px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      <span>Apply to Project</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTeamAds.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">No team ads found matching your criteria</p>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedAd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Select Your Role(s)</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Ad Info */}
            <div className="mb-8 p-6 bg-white/10 rounded-[40px] border border-white/20">
              <p className="text-white/60 text-sm mb-2">Applying to:</p>
              <h3 className="text-xl font-bold text-white">{selectedAd.title}</h3>
              <p className="text-white/50 text-sm mt-1">by {selectedAd.author.name}</p>
            </div>

            {/* Role Selection */}
            <div className="mb-8">
              <p className="text-white/80 text-sm font-semibold mb-4 ml-2">Choose one or more roles:</p>
              <div className="space-y-3">
                {rolesOptions.map((role) => (
                  <label
                    key={role}
                    className="flex items-center space-x-4 px-6 py-4 bg-white/10 hover:bg-white/15 rounded-[30px] border border-white/20 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="w-5 h-5 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-white text-lg font-medium">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitApplication}
              disabled={selectedRoles.length === 0 || submitting}
              className={`w-full px-8 py-5 rounded-[30px] font-bold text-lg transition-all cursor-pointer ${selectedRoles.length > 0 && !submitting
                ? "bg-white hover:bg-white/95 text-gray-900 shadow-2xl hover:shadow-xl"
                : "bg-white/20 text-white/40 cursor-not-allowed"
                }`}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
