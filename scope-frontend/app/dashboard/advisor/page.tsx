"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Bell,
  CheckCircle,
  XCircle,
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
  GraduationCap
} from "lucide-react";
import { toast, Toaster } from "sonner";

interface TeamMember {
  name: string;
  role: string;
  email: string;
}

interface ProjectRequest {
  id: number;
  studentName: string;
  studentEmail: string;
  projectTitle: string;
  projectDescription: string;
  category: string;
  budget: string;
  teamMembers: TeamMember[];
  requestDate: string;
  status: "Pending" | "Accepted" | "Rejected";
  requiredRoles?: string[];
}

interface OngoingProject {
  id: number;
  title: string;
  teamSize: number;
  status: string;
  budget: string;
  teamMembers: TeamMember[];
  category: string;
}

type ViewMode = "dashboard" | "profile-showcase" | "announcements";

export default function AdvisorDashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showOngoingDetailModal, setShowOngoingDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [selectedOngoingProject, setSelectedOngoingProject] = useState<OngoingProject | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Profile data with enhanced fields
  const [profileData, setProfileData] = useState({
    name: "Dr. Demir Han",
    title: "Associate Professor",
    department: "Computer Engineering",
    email: "demir.han@university.edu.tr",
    expertise: ["Machine Learning", "Artificial Intelligence", "Data Science"],
    researchInterests: ["Deep Learning", "Computer Vision", "Natural Language Processing", "Neural Networks"],
    previousProjects: [
      "AI-Based Medical Diagnosis Systems",
      "Smart City IoT Networks",
      "Educational Technology Platforms",
      "Computer Vision for Autonomous Vehicles",
      "Natural Language Processing Tools"
    ]
  });

  const [editFormData, setEditFormData] = useState(profileData);

  // Dynamic stats
  const [stats, setStats] = useState({
    pendingRequests: 8,
    activeProjects: 12,
    totalStudents: 45
  });

  // Incoming requests
  // TODO: Connect to backend API for incoming project requests
  const [requests, setRequests] = useState<ProjectRequest[]>([
    {
      id: 1,
      studentName: "Ali Demir",
      studentEmail: "ali.demir@university.edu.tr",
      projectTitle: "AI-Powered Study Assistant",
      projectDescription: "A machine learning application that helps students organize study materials and generate personalized quizzes based on their learning patterns.",
      category: "AI",
      budget: "15,000 TL",
      teamMembers: [
        { name: "Ali Demir", role: "Project Lead", email: "ali.demir@university.edu.tr" },
        { name: "Ayşe Kara", role: "ML Engineer", email: "ayse.kara@university.edu.tr" },
        { name: "Mehmet Özkan", role: "Frontend Developer", email: "mehmet.ozkan@university.edu.tr" }
      ],
      requestDate: "March 24, 2026",
      status: "Pending",
      requiredRoles: ["ML Engineer", "Frontend Developer", "Backend Developer"]
    },
    {
      id: 2,
      studentName: "Zeynep Yıldız",
      studentEmail: "zeynep.yildiz@university.edu.tr",
      projectTitle: "Smart Campus Navigation System",
      projectDescription: "An IoT-based indoor navigation system using Bluetooth beacons to help students navigate the campus efficiently.",
      category: "IoT",
      budget: "20,000 TL",
      teamMembers: [
        { name: "Zeynep Yıldız", role: "Project Lead", email: "zeynep.yildiz@university.edu.tr" },
        { name: "Can Çelik", role: "IoT Engineer", email: "can.celik@university.edu.tr" }
      ],
      requestDate: "March 23, 2026",
      status: "Pending",
      requiredRoles: ["IoT Engineer", "Mobile Developer"]
    },
    {
      id: 3,
      studentName: "Elif Özdemir",
      studentEmail: "elif.ozdemir@university.edu.tr",
      projectTitle: "Predictive Maintenance for Industrial Equipment",
      projectDescription: "Using machine learning algorithms to predict equipment failures in manufacturing facilities before they occur.",
      category: "AI",
      budget: "18,000 TL",
      teamMembers: [
        { name: "Elif Özdemir", role: "Project Lead", email: "elif.ozdemir@university.edu.tr" },
        { name: "Burak Yılmaz", role: "Data Scientist", email: "burak.yilmaz@university.edu.tr" },
        { name: "Selin Kaya", role: "ML Engineer", email: "selin.kaya@university.edu.tr" }
      ],
      requestDate: "March 22, 2026",
      status: "Pending",
      requiredRoles: ["Data Scientist", "ML Engineer", "Backend Developer"]
    }
  ]);

  // Ongoing projects - will be dynamically updated
  // TODO: Connect to backend API for ongoing projects
  const [ongoingProjects, setOngoingProjects] = useState<OngoingProject[]>([
    {
      id: 101,
      title: "Healthcare Diagnostic System",
      teamSize: 4,
      status: "In Progress",
      budget: "25,000 TL",
      category: "AI",
      teamMembers: [
        { name: "Fatma Yıldırım", role: "Project Lead", email: "fatma.y@university.edu.tr" },
        { name: "Emre Kaya", role: "ML Engineer", email: "emre.k@university.edu.tr" },
        { name: "Deniz Aydın", role: "Backend Developer", email: "deniz.a@university.edu.tr" },
        { name: "Seda Çetin", role: "Frontend Developer", email: "seda.c@university.edu.tr" }
      ]
    },
    {
      id: 102,
      title: "E-Commerce Recommendation Engine",
      teamSize: 3,
      status: "In Progress",
      budget: "18,000 TL",
      category: "Web",
      teamMembers: [
        { name: "Kerem Özkan", role: "Project Lead", email: "kerem.o@university.edu.tr" },
        { name: "Ece Demir", role: "Data Scientist", email: "ece.d@university.edu.tr" },
        { name: "Mert Şahin", role: "Full Stack Developer", email: "mert.s@university.edu.tr" }
      ]
    },
    {
      id: 103,
      title: "Autonomous Drone Navigation",
      teamSize: 5,
      status: "Review Phase",
      budget: "30,000 TL",
      category: "Robotics",
      teamMembers: [
        { name: "Berk Arslan", role: "Project Lead", email: "berk.a@university.edu.tr" },
        { name: "Aylin Yurt", role: "Embedded Systems Engineer", email: "aylin.y@university.edu.tr" },
        { name: "Onur Tekin", role: "Control Systems Engineer", email: "onur.t@university.edu.tr" },
        { name: "İrem Koç", role: "Computer Vision Engineer", email: "irem.k@university.edu.tr" },
        { name: "Cem Aktaş", role: "Software Engineer", email: "cem.a@university.edu.tr" }
      ]
    },
    {
      id: 104,
      title: "Blockchain Supply Chain",
      teamSize: 4,
      status: "In Progress",
      budget: "22,000 TL",
      category: "Blockchain",
      teamMembers: [
        { name: "Gizem Yılmaz", role: "Project Lead", email: "gizem.y@university.edu.tr" },
        { name: "Ahmet Kara", role: "Blockchain Developer", email: "ahmet.k@university.edu.tr" },
        { name: "Sibel Özdemir", role: "Backend Developer", email: "sibel.o@university.edu.tr" },
        { name: "Tolga Erdem", role: "Smart Contract Developer", email: "tolga.e@university.edu.tr" }
      ]
    }
  ]);

  // Mock announcements
  // TODO: Connect to backend API for advisor announcements
  const announcements = [
    {
      id: 1,
      title: "New Funding Opportunity for AI Projects",
      date: "March 25, 2026",
      content: "The university is offering additional funding of up to 50,000 TL for outstanding AI and Machine Learning projects. Applications are open until April 15, 2026.",
      type: "funding"
    },
    {
      id: 2,
      title: "Project Submission Deadline Extended",
      date: "March 24, 2026",
      content: "Due to popular request, the final project submission deadline has been extended to May 30, 2026. Please ensure all documentation is complete.",
      type: "deadline"
    },
    {
      id: 3,
      title: "Annual Research Conference",
      date: "March 22, 2026",
      content: "The Annual Research Conference will be held on April 20, 2026. All advisors and students are encouraged to present their work. Registration is now open.",
      type: "event"
    }
  ];

  const handleAcceptRequest = (requestId: number) => {
    const acceptedRequest = requests.find(req => req.id === requestId);
    if (!acceptedRequest) return;

    // Update request status
    setRequests(requests.map(req =>
      req.id === requestId ? { ...req, status: "Accepted" as const } : req
    ));

    // Update stats: decrement pending, increment active
    setStats(prev => ({
      ...prev,
      pendingRequests: prev.pendingRequests - 1,
      activeProjects: prev.activeProjects + 1
    }));

    // Add to ongoing projects
    const newOngoingProject: OngoingProject = {
      id: Date.now(), // Generate unique ID
      title: acceptedRequest.projectTitle,
      teamSize: acceptedRequest.teamMembers.length,
      status: "In Progress",
      budget: acceptedRequest.budget,
      teamMembers: acceptedRequest.teamMembers,
      category: acceptedRequest.category
    };
    setOngoingProjects([newOngoingProject, ...ongoingProjects]);

    setShowProjectDetailModal(false);
    toast.success("Request Accepted!", {
      description: `${acceptedRequest.projectTitle} has been added to your ongoing projects.`,
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleRejectRequest = (requestId: number) => {
    const rejectedRequest = requests.find(req => req.id === requestId);

    setRequests(requests.map(req =>
      req.id === requestId ? { ...req, status: "Rejected" as const } : req
    ));

    // Update stats: decrement pending
    setStats(prev => ({
      ...prev,
      pendingRequests: prev.pendingRequests - 1
    }));

    setShowProjectDetailModal(false);
    toast.error("Request Declined", {
      description: `You have declined the request for "${rejectedRequest?.projectTitle}".`,
      duration: 4000,
      className: "bg-red-500/90 backdrop-blur-xl text-white border-red-400/50"
    });
  };

  const handleViewProjectDetails = (request: ProjectRequest) => {
    setSelectedRequest(request);
    setShowProjectDetailModal(true);
  };

  const handleViewOngoingDetails = (project: OngoingProject) => {
    setSelectedOngoingProject(project);
    setShowOngoingDetailModal(true);
  };

  const handleSaveProfile = () => {
    setProfileData(editFormData);
    setShowEditProfileModal(false);
    toast.success("Profile Updated!", {
      description: "Your profile has been updated successfully.",
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleLogout = () => {
    router.push("/");
  };

  // Dashboard View
  if (viewMode === "dashboard") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 relative overflow-hidden">
        <Toaster position="bottom-right" />

        {/* Background grain texture */}
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

        {/* Top Navigation Bar */}
        <nav className="relative z-20 px-8 py-4">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-8 py-4 flex items-center justify-between">
            {/* Logo with Image */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <Award className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">SCOPE</div>
            </div>

            {/* Profile Area */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-4 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {profileData.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs">Welcome back,</p>
                  <p className="text-white font-semibold">{profileData.name}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-white/60" strokeWidth={2} />
              </button>

              {/* Opaque Profile Dropdown */}
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
          {/* LEFT SECTION - Enhanced Profile Summary & Availability */}
          <div className="w-80 flex-shrink-0 space-y-6">
            {/* Enhanced Profile Summary */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <h2 className="text-xl font-bold text-white mb-6">Profile Summary</h2>

              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {profileData.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white text-center mb-1">{profileData.name}</h3>
                <p className="text-blue-300 text-center mb-1 font-semibold">{profileData.title}</p>
                <p className="text-white/60 text-center mb-3">{profileData.department}</p>
                <p className="text-white/50 text-sm text-center">{profileData.email}</p>
              </div>

              <div className="mb-6">
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Areas of Expertise</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.expertise.map((skill, idx) => (
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
                  {profileData.researchInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-400/30"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Previously Supervised Projects */}
              <div>
                <h4 className="text-white/80 text-sm font-semibold mb-3 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Previously Supervised Projects</span>
                </h4>
                <div className="bg-white/5 rounded-[30px] p-4 max-h-40 overflow-y-auto space-y-2">
                  {profileData.previousProjects.map((project, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-white/70 text-xs leading-relaxed">{project}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability Status with Smaller Toggle */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <h2 className="text-xl font-bold text-white mb-4">Availability Status</h2>
              <p className="text-white/60 text-sm mb-6">
                {isAvailable ? "You are accepting new project requests" : "You are not accepting new requests"}
              </p>

              <button
                onClick={() => setIsAvailable(!isAvailable)}
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

          {/* CENTER SECTION - Stats & Requests */}
          <div className="flex-1 space-y-6">
            {/* Stats Row */}
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

            {/* Announcements Button */}
            <button
              onClick={() => setShowAnnouncementsModal(true)}
              className="w-full px-8 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 rounded-[30px] text-white font-bold text-lg transition-all flex items-center justify-center space-x-3"
            >
              <Bell className="w-5 h-5" strokeWidth={2.5} />
              <span>View Announcements</span>
            </button>

            {/* Incoming Requests Feed */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Incoming Project Requests</h2>
              <div className="space-y-4">
                {requests.filter(req => req.status === "Pending").map((request) => (
                  <div
                    key={request.id}
                    className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{request.projectTitle}</h3>
                        <div className="flex items-center space-x-3">
                          <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                            {request.category}
                          </span>
                          <span className="text-white/50 text-sm flex items-center space-x-2">
                            <Calendar className="w-4 h-4" strokeWidth={2} />
                            <span>{request.requestDate}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-white/70 mb-4 line-clamp-2">{request.projectDescription}</p>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2 text-white/60">
                        <Users className="w-5 h-5" strokeWidth={2} />
                        <span className="text-sm font-medium">{request.teamMembers.length} members</span>
                      </div>
                      <div className="flex items-center space-x-2 text-white/60">
                        <DollarSign className="w-5 h-5" strokeWidth={2} />
                        <span className="text-sm font-medium">{request.budget}</span>
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

                {requests.filter(req => req.status === "Pending").length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-white/50 text-lg">No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SECTION - Ongoing Projects */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
              <h2 className="text-xl font-bold text-white mb-6">Ongoing Projects</h2>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {ongoingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/10 border border-white/20 rounded-[30px] p-5 hover:bg-white/20 transition-all"
                  >
                    <h4 className="text-white font-semibold mb-2 text-sm">{project.title}</h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/50 text-xs flex items-center space-x-1">
                        <Users className="w-3 h-3" strokeWidth={2} />
                        <span>{project.teamSize} members</span>
                      </span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30">
                        {project.status}
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
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Modal - Glass Overlay with Backdrop Blur */}
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
                        {announcement.type}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mb-4">{announcement.date}</p>
                    <p className="text-white/70 leading-relaxed">{announcement.content}</p>
                  </div>
                ))}
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
                  <h2 className="text-4xl font-bold text-white mb-2">{selectedRequest.projectTitle}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                      {selectedRequest.category}
                    </span>
                    <span className="text-white/60 text-sm">{selectedRequest.requestDate}</span>
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
                  <p className="text-white/70 text-base leading-relaxed">{selectedRequest.projectDescription}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-3">Budget</h3>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-300" strokeWidth={2} />
                    <span className="text-white text-xl font-bold">{selectedRequest.budget}</span>
                  </div>
                </div>

                {selectedRequest.requiredRoles && (
                  <div>
                    <h3 className="text-lg font-semibold text-white/80 mb-3">Required Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.requiredRoles.map((role, idx) => (
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

                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-4">Team Members ({selectedRequest.teamMembers.length})</h3>
                  <div className="space-y-3">
                    {selectedRequest.teamMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20"
                      >
                        <div>
                          <p className="text-white font-semibold">{member.name}</p>
                          <p className="text-white/50 text-sm">{member.email}</p>
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
                      {selectedOngoingProject.category}
                    </span>
                    <span className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30">
                      {selectedOngoingProject.status}
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
                    <span className="text-white text-xl font-bold">{selectedOngoingProject.budget}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white/80 mb-4">Team Members ({selectedOngoingProject.teamMembers.length})</h3>
                  <div className="space-y-3">
                    {selectedOngoingProject.teamMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20"
                      >
                        <div>
                          <p className="text-white font-semibold">{member.name}</p>
                          <p className="text-white/50 text-sm">{member.email}</p>
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

  // Profile Showcase View
  if (viewMode === "profile-showcase") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

        <div className="relative z-10 min-h-screen px-8 py-16">
          {/* Back Button */}
          <button
            onClick={() => setViewMode("dashboard")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-semibold transition-all mx-[0px] mt-[-30px] mb-[32px]"
          >
            ← Back to Dashboard
          </button>

          {/* Top Right Buttons */}
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

          {/* Profile Layout */}
          <div className="max-w-7xl mx-auto mt-16">
            <div className="grid grid-cols-3 gap-8">
              {/* LEFT - Avatar & Basic Info */}
              <div className="col-span-1">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] text-center px-[0px] py-[40px] mx-[0px] my-[-40px]">
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <span className="text-white font-bold text-6xl">
                      {profileData.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-3">{profileData.name}</h1>
                  <p className="text-2xl text-blue-300 mb-2 font-semibold">{profileData.title}</p>
                  <p className="text-xl text-white/60 mb-4">{profileData.department}</p>
                  <p className="text-white/50">{profileData.email}</p>
                </div>
              </div>

              {/* RIGHT - Organized Glass Cards */}
              <div className="col-span-2 space-y-6">
                {/* Expertise */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-[40px] mx-[0px] mt-[-40px] mb-[24px]">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <Target className="w-6 h-6 text-blue-300" />
                    <span>Areas of Expertise</span>
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {profileData.expertise.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-5 py-3 bg-blue-500/20 text-blue-200 rounded-full text-base border border-blue-400/30 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Research Interests */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <BookOpen className="w-6 h-6 text-purple-300" />
                    <span>Research Interests</span>
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {profileData.researchInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-5 py-3 bg-purple-500/20 text-purple-200 rounded-full text-base border border-purple-400/30 font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Supervision History */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <GraduationCap className="w-6 h-6 text-yellow-300" />
                    <span>Supervision History</span>
                  </h2>
                  <div className="space-y-3">
                    {profileData.previousProjects.map((project, idx) => (
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
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Expertise (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.expertise.join(", ")}
                    onChange={(e) => setEditFormData({ ...editFormData, expertise: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">Research Interests (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.researchInterests.join(", ")}
                    onChange={(e) => setEditFormData({ ...editFormData, researchInterests: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all"
                >
                  Save Changes
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
