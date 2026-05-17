"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, User, X, Check, LogOut, Globe, GraduationCap, BookOpen, FolderKanban } from "lucide-react";
import { toast, Toaster } from "sonner";

export interface StudentProject {
  id: number;
  title: string;
  description: string;
  status: string;
  role: string;
}

export interface StudentProfileData {
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
  projectHistory: StudentProject[];
}

export interface EditFormData extends Omit<StudentProfileData, 'technicalSkills'> {
  technicalSkills: string; // Comma-separated string for editing
}

export default function StudentProfile() {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [studentData, setStudentData] = useState<StudentProfileData | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/student");
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
            router.push("/login/student");
            return;
          } else {
            toast.error("Failed to fetch profile data, using fallback");
            throw new Error("Fetch failed");
          }
        }

        const data = await res.json();
        const profile = data.user?.studentProfile || {};

        const fetchedData = {
          fullName: data.user?.name || localStorage.getItem("userName") || "Student User",
          email: data.user.email || "",
          year: profile.year || "Not Specified",
          department: profile.department || "Not Specified",
          technicalSkills: profile.technicalSkills || [],
          interests: profile.interests || [],
          bio: profile.bio || "No bio added yet.",
          linkedinUrl: profile.linkedinUrl || "",
          githubUrl: profile.githubUrl || "",
          education: profile.education || "Not Specified",
          projectHistory: [
            // TODO: Connect to backend API for user's project history
            {
              id: 1,
              title: "AI-Powered Study Assistant",
              description: "Machine learning application for personalized quiz generation",
              status: "Active",
              role: "Project Lead"
            }
          ]
        };

        setStudentData(fetchedData);
        setEditFormData({
          ...fetchedData,
          technicalSkills: fetchedData.technicalSkills.join(", ")
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Using offline fallback data");
        
        // Fallback data so it doesn't get stuck loading
        const fallbackData = {
          fullName: localStorage.getItem("userName") || "Student User",
          email: "student@university.edu",
          year: "Not Specified",
          department: "Not Specified",
          technicalSkills: [],
          interests: [],
          bio: "No bio added yet.",
          linkedinUrl: "",
          githubUrl: "",
          education: "Not Specified",
          projectHistory: []
        };
        setStudentData(fallbackData);
        setEditFormData({
          ...fallbackData,
          technicalSkills: ""
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSaveChanges = () => {
    if (!editFormData || !studentData) return;
    const updatedData: StudentProfileData = {
      ...studentData,
      fullName: editFormData.fullName || "",
      year: editFormData.year || "",
      department: editFormData.department || "",
      email: editFormData.email || "",
      technicalSkills: (editFormData.technicalSkills as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      bio: editFormData.bio || "",
      linkedinUrl: editFormData.linkedinUrl || "",
      githubUrl: editFormData.githubUrl || "",
      education: editFormData.education || "",
      interests: studentData.interests,
      projectHistory: studentData.projectHistory,
    };
    
    setStudentData(updatedData);
    setShowEditModal(false);
    
    toast.success("Profile Updated!", {
      description: "Your profile has been updated successfully.",
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading || !studentData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

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
                {/* Circular Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl flex-shrink-0">
                  <span className="text-white font-bold text-3xl">
                    {studentData.fullName.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>

                {/* Name & Contact */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {studentData.fullName}
                  </h1>
                  <p className="text-xl text-white/80 mb-2">{studentData.year} • {studentData.department}</p>
                  <p className="text-sm text-white/60 mb-4">{studentData.email}</p>
                  
                  {/* Social Links - Vertical List with URLs */}
                  <div className="space-y-2">
                    <a 
                      href={studentData.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-white/70 hover:text-white transition-all group cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                        <Globe className="w-4 h-4 text-blue-300" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{studentData.linkedinUrl.replace('https://', '')}</span>
                    </a>
                    <a 
                      href={studentData.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-white/70 hover:text-white transition-all group cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                        <Globe className="w-4 h-4 text-purple-300" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{studentData.githubUrl.replace('https://', '')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Technical Skills & About */}
              <div className="col-span-1 space-y-6">
                {/* Technical Skills */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-blue-300" />
                    <span>Technical Skills</span>
                  </h2>
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
                </div>

                {/* Interests */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Interests</h2>
                  <div className="space-y-2">
                    {studentData.interests.map((interest, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">{interest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - About & Education & Projects */}
              <div className="col-span-2 space-y-6">
                {/* About Me */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-4">About Me</h2>
                  <p className="text-white/70 leading-relaxed">{studentData.bio}</p>
                </div>

                {/* Education */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-yellow-300" />
                    <span>Education</span>
                  </h2>
                  <p className="text-white/80">{studentData.education}</p>
                </div>

                {/* Project History */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <FolderKanban className="w-5 h-5 text-purple-300" />
                    <span>Project History</span>
                  </h2>
                  <div className="space-y-4">
                    {studentData.projectHistory.map((project) => (
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
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
                    value={editFormData!.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData!, fullName: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Year</label>
                  <input
                    type="text"
                    value={editFormData!.year}
                    onChange={(e) => setEditFormData({ ...editFormData!, year: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Department</label>
                <input
                  type="text"
                  value={editFormData!.department}
                  onChange={(e) => setEditFormData({ ...editFormData!, department: e.target.value })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={editFormData!.email}
                  onChange={(e) => setEditFormData({ ...editFormData!, email: e.target.value })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editFormData!.linkedinUrl}
                    onChange={(e) => setEditFormData({ ...editFormData!, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={editFormData!.githubUrl}
                    onChange={(e) => setEditFormData({ ...editFormData!, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  value={editFormData!.technicalSkills}
                  onChange={(e) => setEditFormData({ ...editFormData!, technicalSkills: e.target.value })}
                  placeholder="React, Python, Machine Learning"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Education</label>
                <input
                  type="text"
                  value={editFormData!.education}
                  onChange={(e) => setEditFormData({ ...editFormData!, education: e.target.value })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">About Me</label>
                <textarea
                  value={editFormData!.bio}
                  onChange={(e) => setEditFormData({ ...editFormData!, bio: e.target.value })}
                  rows={4}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSaveChanges}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>Save Changes</span>
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
