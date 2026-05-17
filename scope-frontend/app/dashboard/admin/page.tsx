"use client";

import { useRouter } from "next/navigation";
import { Users, FolderKanban, LogOut, Plus, Search, X, Award, ChevronDown, Activity, CheckCircle, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";

interface Announcement {
  id: string;
  title: string;
  category: "TÜBİTAK" | "Teknofest" | "Course" | "General";
  content: string;
  createdDate: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: "Student" | "Advisor";
  status: "Active" | "Inactive";
  joinedDate: string;
}

interface Project {
  id: string;
  title: string;
  owner: string;
  status: "Draft" | "Active" | "Completed";
  teamSize: number;
  category: string;
  techStack: string[];
}

interface Category {
  id: string;
  name: string;
  createdDate: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"All" | "Student" | "Advisor">("All");
  const [filterCategory, setFilterCategory] = useState<"All" | "TÜBİTAK" | "Teknofest" | "Course">("All");
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "ADMIN") {
      router.push("/login/admin");
    }
  }, [router]);

  // Stats
  const stats = {
    totalUsers: 156,
    activeProjects: 34,
    teamMatches: 89,
    advisorActivities: 23,
    onlineUsers: 42
  };

  // Categories state
  // TODO: Connect to backend API for categories
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "TÜBİTAK", createdDate: "Jan 10, 2026" },
    { id: "2", name: "Teknofest", createdDate: "Jan 10, 2026" },
    { id: "3", name: "Course", createdDate: "Jan 10, 2026" },
    { id: "4", name: "Research", createdDate: "Feb 15, 2026" },
  ]);

  // Announcement state
  // TODO: Connect to backend API for admin announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "TÜBİTAK 2209-A Support Programme Open",
      category: "TÜBİTAK",
      content: "Applications are now open for undergraduate research project support. Deadline: April 30, 2026.",
      createdDate: "March 20, 2026"
    },
    {
      id: "2",
      title: "Teknofest 2026 Team Formation Deadline",
      category: "Teknofest",
      content: "Teams must be finalized by April 1st for Teknofest competition entries.",
      createdDate: "March 18, 2026"
    },
    {
      id: "3",
      title: "Spring Semester Course Projects Announced",
      category: "Course",
      content: "New course project topics are available for CS401 and CS402. Check the course portal for details.",
      createdDate: "March 15, 2026"
    }
  ]);

  // Form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    category: "General" as "TÜBİTAK" | "Teknofest" | "Course" | "General",
    content: ""
  });

  // Mock users
  // TODO: Connect to backend API for all users
  const [users, setUsers] = useState<User[]>([
    { id: "1", email: "ali.yilmaz@university.edu", name: "Ali Yılmaz", role: "Student", status: "Active", joinedDate: "Jan 15, 2026" },
    { id: "2", email: "ayse.yilmaz@university.edu", name: "Prof. Dr. Ayşe Yılmaz", role: "Advisor", status: "Active", joinedDate: "Jan 10, 2026" },
    { id: "3", email: "zeynep.ozkan@university.edu", name: "Zeynep Özkan", role: "Student", status: "Active", joinedDate: "Feb 5, 2026" },
    { id: "4", email: "mehmet.kaya@university.edu", name: "Assoc. Prof. Mehmet Kaya", role: "Advisor", status: "Active", joinedDate: "Jan 12, 2026" },
    { id: "5", email: "elif.celik@university.edu", name: "Elif Çelik", role: "Student", status: "Inactive", joinedDate: "March 22, 2026" },
    { id: "6", email: "can.ozkan@university.edu", name: "Prof. Dr. Can Özkan", role: "Advisor", status: "Active", joinedDate: "Jan 8, 2026" },
    { id: "7", email: "burak.arslan@university.edu", name: "Burak Arslan", role: "Student", status: "Active", joinedDate: "Feb 18, 2026" },
    { id: "8", email: "zeynep.demir@university.edu", name: "Dr. Zeynep Demir", role: "Advisor", status: "Active", joinedDate: "Jan 20, 2026" }
  ]);

  // Mock projects
  // TODO: Connect to backend API for all projects
  const projects: Project[] = [
    { id: "1", title: "AI-Powered Smart Agriculture System", owner: "Ali Yılmaz", status: "Active", teamSize: 3, category: "TÜBİTAK", techStack: ["Python", "TensorFlow", "IoT"] },
    { id: "2", title: "Autonomous Drone Navigation", owner: "Zeynep Özkan", status: "Active", teamSize: 2, category: "Teknofest", techStack: ["C++", "ROS", "Computer Vision"] },
    { id: "3", title: "E-Commerce Platform Development", owner: "Elif Çelik", status: "Draft", teamSize: 4, category: "Course", techStack: ["React", "Node.js", "MongoDB"] },
    { id: "4", title: "Blockchain Voting System", owner: "Burak Arslan", status: "Active", teamSize: 3, category: "TÜBİTAK", techStack: ["Solidity", "Web3", "React"] },
    { id: "5", title: "Smart Home IoT Hub", owner: "Ali Yılmaz", status: "Draft", teamSize: 2, category: "Course", techStack: ["Python", "Raspberry Pi", "MQTT"] }
  ];

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "All" || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = projectSearchQuery === "" ||
      project.title.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      project.owner.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      project.techStack.some(tech => tech.toLowerCase().includes(projectSearchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "All" || project.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleLogout = () => {
    router.push("/");
  };

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error("Please fill in all fields");
      return;
    }

    const announcement: Announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    setAnnouncements([announcement, ...announcements]);
    setShowCreateModal(false);
    setNewAnnouncement({ title: "", category: "General", content: "" });
    
    toast.success("Announcement Created!", {
      description: "The announcement has been published to all users.",
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" as "Active" | "Inactive" }
        : user
    ));
    
    const user = users.find(u => u.id === userId);
    toast.success(`User ${user?.status === "Active" ? "Deactivated" : "Activated"}`, {
      duration: 3000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName) {
      toast.error("Please enter a category name");
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    setCategories([category, ...categories]);
    setShowCategoryModal(false);
    setNewCategoryName("");
    
    toast.success("Category Created!", {
      description: "The category has been added successfully.",
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const currentCategoryId = editingCategory.id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${currentCategoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: editCategoryName }),
      });

      setCategories(categories.map(c => c.id === currentCategoryId ? { ...c, name: editCategoryName } : c));
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      setEditCategoryName("");
      
      if (res.ok) {
        toast.success("Category Updated!", {
          duration: 3000,
          className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
        });
      } else {
        toast.success("Category Updated (Local Only)", {
          description: "Could not sync with backend.",
          duration: 3000,
          className: "bg-yellow-500/90 backdrop-blur-xl text-white border-yellow-400/50"
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 relative overflow-hidden">
      <Toaster position="bottom-right" />
      
      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

      {/* Top Navigation Bar */}
      <nav className="relative z-20 px-8 py-4">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Award className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">SCOPE</div>
            <span className="px-4 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs font-semibold border border-purple-400/30">
              Admin
            </span>
          </div>

          {/* Profile Area */}
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

            {/* Profile Dropdown */}
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

          {/* Advisor Activities with Live Indicator */}
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

        {/* Row 2: Activity Overview Chart */}
        

        <div className="grid grid-cols-2 gap-6">
          {/* User Management Section */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
            
            {/* Filters and Search */}
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
                {(["All", "Student", "Advisor"] as const).map((role) => (
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

            {/* User Table */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
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
                      user.role === "Student"
                        ? "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                        : "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                    }`}>
                      {user.role}
                    </span>
                    <button
                      onClick={() => handleToggleUserStatus(user.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        user.status === "Active"
                          ? "bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/30"
                          : "bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-green-500/20 hover:text-green-200 hover:border-green-400/30"
                      }`}
                    >
                      {user.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Exploration */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
            <h2 className="text-2xl font-bold text-white mb-6">Project Exploration</h2>
            
            {/* Search and Filters */}
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
              
              <div className="flex space-x-3">
                {(["All", "TÜBİTAK", "Teknofest", "Course"] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      filterCategory === category
                        ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                        : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="px-6 py-4 bg-white/10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{project.title}</p>
                      <p className="text-white/50 text-sm">by {project.owner}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === "Active"
                        ? "bg-green-500/20 text-green-200 border border-green-400/30"
                        : project.status === "Draft"
                        ? "bg-yellow-500/20 text-yellow-200 border border-yellow-400/30"
                        : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
                <p className="text-white/40 text-xs">{announcement.createdDate}</p>
              </div>
            ))}
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
                    <p className="text-white/40 text-xs">{category.createdDate}</p>
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
                      onClick={() => {
                        setCategories(categories.filter(c => c.id !== category.id));
                        toast.success("Category Deleted!", {
                          duration: 3000,
                          className: "bg-red-500/90 backdrop-blur-xl text-white border-red-400/50"
                        });
                      }}
                      className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4 text-red-300" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all"
              >
                Publish Announcement
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
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all"
              >
                Create Category
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
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all"
              >
                Update Category
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
