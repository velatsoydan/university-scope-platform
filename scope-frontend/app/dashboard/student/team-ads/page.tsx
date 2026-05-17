"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, X, Check } from "lucide-react";

interface TeamAd {
  id: number;
  type: "team";
  title: string;
  description: string;
  fullDescription?: string;
  date: string;
  category: string;
  author: string;
  projectType: "Mobile" | "AI" | "Web" | "Robotics";
  technicalSkills: string[];
  interests: string[];
}

export default function StudentTeamAds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<TeamAd | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Filter states
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Role selection for application
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Track applied projects
  const [appliedProjects, setAppliedProjects] = useState<Set<number>>(new Set());

  // Team Ads (Student Announcements)
  // TODO: Connect to backend API for team advertisements
  const teamAds: TeamAd[] = [
    {
      id: 2,
      type: "team",
      title: "Looking for ML Engineer - AI Agriculture Project",
      description: "We're building a smart agriculture system and need someone with Python/TensorFlow experience.",
      fullDescription: "We're building a smart agriculture system and need someone with Python/TensorFlow experience. Our project aims to develop an AI-powered crop disease detection system using drone imagery and machine learning. The system will help farmers identify plant diseases early, reducing crop loss and optimizing pesticide use. We need a team member who can work on computer vision models, data preprocessing, and model deployment. Experience with convolutional neural networks and transfer learning is a plus. This is a TÜBİTAK-funded project with opportunities for publication.",
      date: "March 19, 2026",
      category: "Team Search",
      author: "Ali Yılmaz",
      projectType: "AI",
      technicalSkills: ["Python", "TensorFlow", "Machine Learning"],
      interests: ["AI", "Agriculture", "IoT"]
    },
    {
      id: 4,
      type: "team",
      title: "Frontend Developer Needed for E-Commerce Platform",
      description: "Join our team to build a modern React-based e-commerce solution.",
      fullDescription: "Join our team to build a modern React-based e-commerce solution. We're developing a full-featured online marketplace with advanced features like real-time inventory management, AI-powered product recommendations, and seamless payment integration. Looking for a frontend developer skilled in React, TypeScript, and modern CSS frameworks. You'll be responsible for building responsive UI components, implementing state management with Redux, and ensuring optimal performance. Experience with Next.js and Tailwind CSS is highly valued. This is a course project for CS401 with potential for real-world deployment.",
      date: "March 17, 2026",
      category: "Team Search",
      author: "Elif Çelik",
      projectType: "Web",
      technicalSkills: ["React", "TypeScript", "Tailwind CSS"],
      interests: ["Web Development", "E-Commerce", "UI/UX"]
    },
    {
      id: 6,
      type: "team",
      title: "Robotics Engineer for Autonomous Drone Project",
      description: "Looking for team members with experience in robotics and embedded systems.",
      fullDescription: "Looking for team members with experience in robotics and embedded systems. We're building an autonomous delivery drone for Teknofest 2026 competition. The project involves hardware design, sensor integration (GPS, IMU, cameras), path planning algorithms, and obstacle avoidance. We need someone with strong C++ skills, ROS (Robot Operating System) experience, and knowledge of Arduino/Raspberry Pi. You'll work on flight control systems, computer vision for object detection, and real-time decision-making. Previous experience with drone projects or embedded systems is essential. Team currently has 3 members.",
      date: "March 14, 2026",
      category: "Team Search",
      author: "Can Özkan",
      projectType: "Robotics",
      technicalSkills: ["C++", "ROS", "Arduino", "Computer Vision"],
      interests: ["Robotics", "Drones", "Embedded Systems"]
    },
    {
      id: 7,
      type: "team",
      title: "Mobile Developer for Health & Fitness App",
      description: "Building a cross-platform fitness tracking app with AI-powered workout recommendations.",
      fullDescription: "Building a cross-platform fitness tracking app with AI-powered workout recommendations. We're creating a comprehensive health and fitness platform that tracks workouts, nutrition, sleep patterns, and provides personalized coaching. Looking for a mobile developer with React Native or Flutter experience. You'll be responsible for implementing user authentication, data visualization, push notifications, and integrating with wearable device APIs. Experience with health data APIs (Apple HealthKit, Google Fit) is a plus. This project is part of the Spring semester course and has potential for commercialization.",
      date: "March 13, 2026",
      category: "Team Search",
      author: "Zeynep Kara",
      projectType: "Mobile",
      technicalSkills: ["React Native", "Flutter", "Firebase"],
      interests: ["Mobile Development", "Health Tech", "UI/UX"]
    },
  ];

  // Available filters
  const projectTypes = ["Mobile", "AI", "Web", "Robotics"];
  const skillsOptions = ["React", "Python", "C++", "TypeScript", "Machine Learning", "TensorFlow", "Arduino"];
  const rolesOptions = ["Frontend", "Backend", "Designer", "ML Engineer", "DevOps"];

  // Filter logic
  const filteredTeamAds = teamAds.filter(item => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());

    // Project type filter
    const matchesProjectType = selectedProjectTypes.length === 0 ||
      selectedProjectTypes.includes(item.projectType);

    // Skills filter
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill => item.technicalSkills.includes(skill));

    return matchesSearch && matchesProjectType && matchesSkills;
  });

  const toggleExpand = (id: number) => {
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

  const handleApplyClick = (ad: TeamAd) => {
    setSelectedProject(ad);
    setSelectedRoles([]);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = () => {
    if (selectedRoles.length === 0) return;

    setShowApplyModal(false);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 4000);

    // Add the project ID to the applied projects set
    setAppliedProjects(prev => new Set([...prev, selectedProject!.id]));
  };

  return (
    <div className="p-8">
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
        {/* Project Type Filters */}
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

        {/* Required Skills Filters */}
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
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        {filteredTeamAds.map((item) => {
          const isExpanded = expandedCard === item.id;

          return (
            <div
              key={item.id}
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
                    {item.projectType}
                  </span>
                  <span className="text-white/50 text-sm">by {item.author}</span>
                </div>
                <span className="text-white/50 text-sm">{item.date}</span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>

              {/* Description */}
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                {isExpanded ? item.fullDescription : item.description}
              </p>

              {/* Skills Tags */}
              {isExpanded && (
                <div className="mb-6">
                  <p className="text-white/60 text-sm font-semibold mb-3">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.technicalSkills.map((skill, idx) => (
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
                  onClick={() => toggleExpand(item.id)}
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
                  appliedProjects.has(item.id) ? (
                    <button
                      disabled
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-500/30 border border-blue-400/50 text-blue-200 rounded-full font-bold cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      <span>Applied</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyClick(item)}
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
      {showApplyModal && selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Select Your Role(s)</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20 cursor-pointer"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Project Info */}
            <div className="mb-8 p-6 bg-white/10 rounded-[40px] border border-white/20">
              <p className="text-white/60 text-sm mb-2">Applying to:</p>
              <h3 className="text-xl font-bold text-white">{selectedProject.title}</h3>
              <p className="text-white/50 text-sm mt-1">by {selectedProject.author}</p>
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
              disabled={selectedRoles.length === 0}
              className={`w-full px-8 py-5 rounded-[30px] font-bold text-lg transition-all cursor-pointer ${selectedRoles.length > 0
                ? "bg-white hover:bg-white/95 text-gray-900 shadow-2xl hover:shadow-xl"
                : "bg-white/20 text-white/40 cursor-not-allowed"
                }`}
            >
              Submit Application
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideInFromRight">
          <div className="bg-blue-500/90 backdrop-blur-xl rounded-[30px] border border-blue-400/50 px-8 py-5 shadow-2xl flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Application Sent Successfully!</p>
              <p className="text-white/80 text-sm">The team will review your application soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
