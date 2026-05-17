"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Mail, MapPin, Award, BookOpen, Target, GraduationCap, ChevronLeft, Edit3, LogOut, X } from "lucide-react";
import { toast, Toaster } from "sonner";

export interface AdvisorProfileData {
  name: string;
  email: string;
  title: string;
  department: string;
  expertise: string[];
  researchInterests: string[];
  previousProjects: string[];
  github: string;
  linkedin: string;
}

export default function AdvisorProfile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState<AdvisorProfileData | null>(null);
  const [editFormData, setEditFormData] = useState<AdvisorProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/advisor");
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/users/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.error("Profile fetch failed:", res.status);
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            router.push("/login/advisor");
            return;
          } else {
            toast.error("Failed to fetch profile data, using fallback");
            throw new Error("Fetch failed");
          }
        }

        const data = await res.json();
        const profile = data.user?.advisorProfile || {};

        const fetchedData = {
          name: data.user?.name || localStorage.getItem("userName") || "Advisor User",
          email: data.user.email || "",
          title: profile.title || "Not Specified",
          department: profile.department || "Not Specified",
          expertise: profile.expertise || [],
          researchInterests: profile.researchInterests || [],
          previousProjects: profile.previousProjects || [],
          github: profile.githubUrl || "https://github.com/",
          linkedin: profile.linkedinUrl || "https://linkedin.com/in/"
        };

        setProfileData(fetchedData);
        setEditFormData(fetchedData);
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Using offline fallback data");
        
        // Fallback data so it doesn't get stuck loading
        const fallbackData = {
          name: localStorage.getItem("userName") || "Advisor User",
          email: "advisor@university.edu",
          title: "Not Specified",
          department: "Not Specified",
          expertise: [],
          researchInterests: [],
          previousProjects: [],
          github: "https://github.com/",
          linkedin: "https://linkedin.com/in/"
        };
        setProfileData(fallbackData);
        setEditFormData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSaveChanges = () => {
    if (!editFormData) return;
    setProfileData(editFormData);
    setIsEditing(false);
    toast.success("Profile Updated!", {
      description: "Your profile has been updated successfully.",
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleCancel = () => {
    setEditFormData(profileData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading || !profileData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px'
      }}></div>

      {/* Header with Back Button */}
      <div className="relative z-10 px-12 py-8">
        <button
          onClick={() => router.push("/dashboard/advisor")}
          className="flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full text-white transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-12 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Profile Header Card */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-12 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData!.name}
                    onChange={(e) => setEditFormData({ ...editFormData!, name: e.target.value })}
                    className="text-5xl font-bold text-white mb-3 bg-white/10 border border-white/20 rounded-[30px] px-6 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                ) : (
                  <h1 className="text-5xl font-bold text-white mb-3">{profileData.name}</h1>
                )}

                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData!.title}
                    onChange={(e) => setEditFormData({ ...editFormData!, title: e.target.value })}
                    className="text-2xl text-white/80 mb-2 bg-white/10 border border-white/20 rounded-[30px] px-6 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                ) : (
                  <p className="text-2xl text-white/80 mb-2">{profileData.title}</p>
                )}

                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData!.department}
                    onChange={(e) => setEditFormData({ ...editFormData!, department: e.target.value })}
                    className="text-xl text-white/60 mb-6 bg-white/10 border border-white/20 rounded-[30px] px-6 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                ) : (
                  <p className="text-xl text-white/60 mb-6">{profileData.department}</p>
                )}

                {/* Contact Info */}
                <div className="flex items-center space-x-2 text-white/70 mb-4">
                  <Mail className="w-5 h-5" strokeWidth={1.5} />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editFormData!.email}
                      onChange={(e) => setEditFormData({ ...editFormData!, email: e.target.value })}
                      className="text-lg bg-white/10 border border-white/20 rounded-[30px] px-6 py-2 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                  ) : (
                    <span className="text-lg">{profileData.email}</span>
                  )}
                </div>
              </div>

              {/* Profile Image Placeholder */}
              <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[40px] flex items-center justify-center">
                <GraduationCap className="w-20 h-20 text-white" strokeWidth={1.5} />
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 mt-8 pt-8 border-t border-white/20">
              <div className="flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white">
                <Globe className="w-5 h-5" strokeWidth={2} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData!.github}
                    onChange={(e) => setEditFormData({ ...editFormData!, github: e.target.value })}
                    className="font-medium bg-transparent border-none text-white focus:outline-none w-64"
                  />
                ) : (
                  <span className="font-medium">{profileData.github}</span>
                )}
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white">
                <Globe className="w-5 h-5" strokeWidth={2} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData!.linkedin}
                    onChange={(e) => setEditFormData({ ...editFormData!, linkedin: e.target.value })}
                    className="font-medium bg-transparent border-none text-white focus:outline-none w-64"
                  />
                ) : (
                  <span className="font-medium">{profileData.linkedin}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mt-8 pt-8 border-t border-white/20">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="flex items-center space-x-2 px-8 py-4 bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-sm border border-blue-400/50 rounded-full text-blue-200 font-bold transition-all cursor-pointer"
                  >
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-5 h-5" strokeWidth={2} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-8 py-4 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30 rounded-full text-red-300 font-bold transition-all cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={2} />
                    <span>Log Out</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Grid of Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Expertise Card */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-[20px] flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-300" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-white">Expertise</h2>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editFormData!.expertise.join(", ")}
                  onChange={(e) => setEditFormData({ ...editFormData!, expertise: e.target.value.split(",").map((s: string) => s.trim()) })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Separate with commas"
                />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {profileData.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-3 bg-blue-500/20 text-blue-200 rounded-full font-medium border border-blue-400/30"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Research Interests Card */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-[20px] flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-300" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-white">Research Interests</h2>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editFormData!.researchInterests.join(", ")}
                  onChange={(e) => setEditFormData({ ...editFormData!, researchInterests: e.target.value.split(",").map((s: string) => s.trim()) })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Separate with commas"
                />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {profileData.researchInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-3 bg-purple-500/20 text-purple-200 rounded-full font-medium border border-purple-400/30"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Projects Card - Full Width */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-violet-500/20 rounded-[20px] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-violet-300" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-white">Previous Projects</h2>
              </div>
              {isEditing ? (
                <textarea
                  value={editFormData!.previousProjects.join("\n")}
                  onChange={(e) => setEditFormData({ ...editFormData!, previousProjects: e.target.value.split("\n").filter((s: string) => s.trim()) })}
                  rows={6}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Each project on a new line"
                />
              ) : (
                <div className="space-y-3">
                  {profileData.previousProjects.map((project, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-[30px] border border-white/20"
                    >
                      <div className="w-2 h-2 bg-violet-400 rounded-full mt-2"></div>
                      <span className="text-white/90 text-lg flex-1">{project}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Toaster for Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
