"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, Calendar, X, Check, User } from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); endpoints below prepend
// /api explicitly to stay consistent with the rest of the app.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma (ProjectApplication + relations)
// -----------------------------------------------------------------------------
type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface SentApplicationDTO {
  id: string;
  projectId: string;
  requestedRoles: string[];
  status: ApplicationStatus;
  appliedAt: string;
  project: {
    id: string;
    title: string;
    status: string;
    category: { id: string; name: string } | null;
    owner: { id: string; name: string; email: string };
  };
}

interface IncomingApplicationDTO {
  id: string;
  projectId: string;
  studentId: string;
  requestedRoles: string[];
  status: ApplicationStatus;
  appliedAt: string;
  project: {
    id: string;
    title: string;
    category: { id: string; name: string } | null;
  };
  student: {
    id: string;
    name: string;
    email: string;
    studentProfile: {
      technicalSkills: string[];
      interests: string[];
      bio: string | null;
      department: string | null;
      year: string | null;
    } | null;
  };
}

type TabType = "sent" | "incoming";
type UIStatus = "Pending" | "Accepted" | "Rejected";

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

function humanizeStatus(s: ApplicationStatus): UIStatus {
  switch (s) {
    case "PENDING": return "Pending";
    case "ACCEPTED": return "Accepted";
    case "REJECTED": return "Rejected";
  }
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function StudentMyApplicationsAdvanced() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("sent");
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<IncomingApplicationDTO | null>(null);

  const [sentApps, setSentApps] = useState<SentApplicationDTO[]>([]);
  const [incomingApps, setIncomingApps] = useState<IncomingApplicationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------------------------
  const fetchSent = useCallback(async () => {
    const res = await fetch(`${API_URL}/applications/mine`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`Sent applications fetch failed (${res.status})`);
    const data = (await res.json()) as { applications: SentApplicationDTO[] };
    setSentApps(data.applications ?? []);
  }, []);

  const fetchIncoming = useCallback(async () => {
    const res = await fetch(`${API_URL}/applications/incoming`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!res.ok) throw new Error(`Incoming applications fetch failed (${res.status})`);
    const data = (await res.json()) as { applications: IncomingApplicationDTO[] };
    setIncomingApps(data.applications ?? []);
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
        await Promise.all([fetchSent(), fetchIncoming()]);
      } catch (err) {
        console.error("My applications load failed:", err);
        const message = err instanceof Error ? err.message : "Failed to load applications";
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
  }, [router, fetchSent, fetchIncoming]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCancelApplication = async (appId: string) => {
    try {
      const res = await fetch(`${API_URL}/applications/${appId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      // Drop the row from local state without refetching everything.
      setSentApps(prev => prev.filter(app => app.id !== appId));
      toast.success("Application cancelled successfully", {
        duration: 4000,
        className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
      });
    } catch (err) {
      console.error("Cancel application failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to cancel application");
    }
  };

  const handleViewApplicant = (applicant: IncomingApplicationDTO) => {
    setSelectedApplicant(applicant);
    setShowApplicantModal(true);
  };

  const respondToIncoming = async (appId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`${API_URL}/applications/${appId}/respond`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setShowApplicantModal(false);
      setSelectedApplicant(null);
      // Refresh both lists — accepting one application server-side auto-rejects
      // the same student's other pending applications across the system.
      await Promise.all([fetchIncoming(), fetchSent()]);
      toast.success(
        status === "ACCEPTED"
          ? "Application accepted! Applicant added to team"
          : "Application rejected",
        {
          duration: 4000,
          className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50",
        }
      );
    } catch (err) {
      console.error(`Respond ${status} failed:`, err);
      toast.error(err instanceof Error ? err.message : "Failed to update application");
    }
  };

  const handleAcceptApplication = (appId: string) => respondToIncoming(appId, "ACCEPTED");
  const handleRejectApplication = (appId: string) => respondToIncoming(appId, "REJECTED");

  // ---------------------------------------------------------------------------
  // UI helpers — keep the existing badge palette intact
  // ---------------------------------------------------------------------------
  const getStatusIcon = (status: UIStatus) => {
    switch (status) {
      case "Pending":  return <Clock className="w-5 h-5" strokeWidth={2} />;
      case "Accepted": return <CheckCircle className="w-5 h-5" strokeWidth={2} />;
      case "Rejected": return <XCircle className="w-5 h-5" strokeWidth={2} />;
      default: return null;
    }
  };

  const getStatusColor = (status: UIStatus) => {
    switch (status) {
      case "Pending":  return "bg-yellow-500/20 text-yellow-200 border-yellow-400/30";
      case "Accepted": return "bg-green-500/20 text-green-200 border-green-400/30";
      case "Rejected": return "bg-red-500/20 text-red-200 border-red-400/30";
      default: return "bg-white/10 text-white/70 border-white/20";
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
        <h1 className="text-4xl font-bold text-white mb-2">My Applications</h1>
        <p className="text-white/60 text-lg">Track your applications and review incoming requests</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex justify-center">
        <div className="flex space-x-3 p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-8 py-3 rounded-full font-semibold transition-all cursor-pointer ${
              activeTab === "sent"
                ? "bg-white/90 text-gray-900 shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            Applications I Sent
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`px-8 py-3 rounded-full font-semibold transition-all cursor-pointer ${
              activeTab === "incoming"
                ? "bg-white/90 text-gray-900 shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            Incoming Applications
          </button>
        </div>
      </div>

      {/* Applications I Sent */}
      {activeTab === "sent" && (
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {sentApps.map((app) => {
            const uiStatus = humanizeStatus(app.status);
            return (
              <div
                key={app.id}
                className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="px-5 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-200 rounded-full text-sm font-medium border border-blue-400/30">
                      {app.project.category?.name ?? "Uncategorized"}
                    </span>
                    <span className={`px-5 py-2 backdrop-blur-sm rounded-full text-sm font-medium border flex items-center space-x-2 ${getStatusColor(uiStatus)}`}>
                      {getStatusIcon(uiStatus)}
                      <span>{uiStatus}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/50 text-sm">
                    <Calendar className="w-4 h-4" strokeWidth={2} />
                    <span>{formatDate(app.appliedAt)}</span>
                  </div>
                </div>

                {/* Project Title */}
                <h3 className="text-2xl font-bold text-white mb-3">{app.project.title}</h3>

                {/* Project Owner */}
                <p className="text-white/60 text-base mb-4">by {app.project.owner.name}</p>

                {/* Applied Roles */}
                <div className="mb-6">
                  <p className="text-white/60 text-sm font-semibold mb-3">Applied as:</p>
                  <div className="flex flex-wrap gap-2">
                    {app.requestedRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {uiStatus === "Pending" && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleCancelApplication(app.id)}
                      className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-full font-semibold transition-all cursor-pointer"
                    >
                      Cancel Request
                    </button>
                    <div className="flex items-center space-x-2 text-white/50 text-sm">
                      <Clock className="w-4 h-4" strokeWidth={2} />
                      <span>Waiting for team owner&apos;s response...</span>
                    </div>
                  </div>
                )}

                {uiStatus === "Accepted" && (
                  null
                )}

                {uiStatus === "Rejected" && (
                  <div className="flex items-center space-x-2 text-red-300/70 text-sm">
                    <XCircle className="w-4 h-4" strokeWidth={2} />
                    <span>Application was not accepted by the team</span>
                  </div>
                )}
              </div>
            );
          })}

          {sentApps.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/50 text-lg">You haven&apos;t sent any applications yet</p>
            </div>
          )}
        </div>
      )}

      {/* Incoming Applications */}
      {activeTab === "incoming" && (
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {incomingApps.map((app) => {
            const uiStatus = humanizeStatus(app.status);
            return (
              <div
                key={app.id}
                className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{app.student.name}</h4>
                      <p className="text-white/50 text-sm">{app.student.email}</p>
                    </div>
                  </div>
                  <span className={`px-5 py-2 backdrop-blur-sm rounded-full text-sm font-medium border flex items-center space-x-2 ${getStatusColor(uiStatus)}`}>
                    {getStatusIcon(uiStatus)}
                    <span>{uiStatus}</span>
                  </span>
                </div>

                {/* Project Info */}
                <div className="mb-4 p-4 bg-white/10 rounded-[30px] border border-white/20">
                  <p className="text-white/60 text-sm mb-1">Applying to:</p>
                  <p className="text-white font-semibold">{app.project.title}</p>
                </div>

                {/* Applied Roles */}
                <div className="mb-6">
                  <p className="text-white/60 text-sm font-semibold mb-3">Applied as:</p>
                  <div className="flex flex-wrap gap-2">
                    {app.requestedRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Applied Date */}
                <div className="flex items-center space-x-2 text-white/50 text-sm mb-6">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  <span>Applied on {formatDate(app.appliedAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleViewApplicant(app)}
                    className="flex-1 px-6 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-[30px] font-bold transition-all shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    View Details
                  </button>

                  {uiStatus === "Pending" && (
                    <>
                      <button
                        onClick={() => handleAcceptApplication(app.id)}
                        className="px-6 py-4 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 rounded-[30px] font-bold transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectApplication(app.id)}
                        className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-[30px] font-bold transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {incomingApps.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/50 text-lg">No incoming applications</p>
            </div>
          )}
        </div>
      )}

      {/* Applicant Details Modal */}
      {showApplicantModal && selectedApplicant && (() => {
        const uiStatus = humanizeStatus(selectedApplicant.status);
        const profile = selectedApplicant.student.studentProfile;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
            <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedApplicant.student.name}</h2>
                    <p className="text-white/60">{selectedApplicant.student.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplicantModal(false)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
                >
                  <X className="w-6 h-6 text-white" strokeWidth={2} />
                </button>
              </div>

              {/* Project Info */}
              <div className="mb-8 p-6 bg-white/10 rounded-[40px] border border-white/20">
                <p className="text-white/60 text-sm mb-2">Applying to:</p>
                <h3 className="text-xl font-bold text-white">{selectedApplicant.project.title}</h3>
                <p className="text-white/50 text-sm mt-1">Applied on {formatDate(selectedApplicant.appliedAt)}</p>
              </div>

              {/* Applied Roles */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white/80 mb-3">Applied Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.requestedRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-3 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30 font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Skills */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white/80 mb-3">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile?.technicalSkills ?? []).length > 0 ? (
                    profile!.technicalSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/40 text-sm">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Interests */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white/80 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile?.interests ?? []).length > 0 ? (
                    profile!.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/40 text-sm">No interests listed</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white/80 mb-3">About</h3>
                <p className="text-white/70 text-base leading-relaxed">
                  {profile?.bio ?? "No bio added yet."}
                </p>
              </div>

              {/* Action Buttons */}
              {uiStatus === "Pending" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAcceptApplication(selectedApplicant.id)}
                    className="flex-1 px-8 py-5 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-6 h-6" strokeWidth={2} />
                    <span>Accept Application</span>
                  </button>
                  <button
                    onClick={() => handleRejectApplication(selectedApplicant.id)}
                    className="flex-1 px-8 py-5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <X className="w-6 h-6" strokeWidth={2} />
                    <span>Reject Application</span>
                  </button>
                </div>
              )}

              {uiStatus === "Accepted" && (
                <div className="p-6 bg-green-500/20 rounded-[30px] border border-green-400/30 text-center">
                  <p className="text-green-200 font-semibold text-lg">✓ Application Accepted</p>
                </div>
              )}

              {uiStatus === "Rejected" && (
                <div className="p-6 bg-red-500/20 rounded-[30px] border border-red-400/30 text-center">
                  <p className="text-red-200 font-semibold text-lg">✗ Application Rejected</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
