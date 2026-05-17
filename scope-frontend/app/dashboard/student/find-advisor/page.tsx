"use client";

import { useState } from "react";
import { Search, Send, X, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface Advisor {
  id: number;
  name: string;
  title: string;
  department: string;
  expertise: string[];
  availability: "available" | "limited" | "unavailable";
}

interface Project {
  id: number;
  title: string;
  status: string;
  requestedAdvisors?: number[]; // Track which advisors have pending requests
}

export default function StudentFindAdvisor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);

  // Mock projects with requested advisors tracking
  const [myProjects, setMyProjects] = useState<Project[]>([
    {
      id: 1,
      title: "AI-Powered Study Assistant",
      status: "Pending Advisor",
      requestedAdvisors: [1] // Already requested from advisor with id 1
    },
    {
      id: 2,
      title: "Campus Event Management Platform",
      status: "Pending Advisor",
      requestedAdvisors: []
    }
  ]);

  // Mock advisor data
  // TODO: Connect to backend API for fetching available advisors
  const advisors: Advisor[] = [
    {
      id: 1,
      name: "Prof. Dr. Ayşe Yılmaz",
      title: "Professor",
      department: "Computer Engineering",
      expertise: ["Machine Learning", "AI", "Computer Vision"],
      availability: "available"
    },
    {
      id: 2,
      name: "Assoc. Prof. Mehmet Kaya",
      title: "Associate Professor",
      department: "Software Engineering",
      expertise: ["Web Development", "Cloud Computing", "DevOps"],
      availability: "limited"
    },
    {
      id: 3,
      name: "Dr. Zeynep Demir",
      title: "Assistant Professor",
      department: "Data Science",
      expertise: ["Data Analytics", "Big Data", "IoT"],
      availability: "available"
    },
    {
      id: 4,
      name: "Prof. Dr. Can Özkan",
      title: "Professor",
      department: "Robotics",
      expertise: ["Robotics", "Embedded Systems", "Control Systems"],
      availability: "unavailable"
    },
    {
      id: 5,
      name: "Dr. Elif Şahin",
      title: "Assistant Professor",
      department: "Computer Engineering",
      expertise: ["Mobile Development", "UI/UX", "Human-Computer Interaction"],
      availability: "available"
    },
  ];

  // All expertise options for filters
  const expertiseOptions = [
    "Machine Learning",
    "AI",
    "Web Development",
    "Mobile Development",
    "Robotics",
    "Data Analytics",
    "IoT",
    "Cloud Computing"
  ];

  // Filter advisors
  const filteredAdvisors = advisors.filter(advisor => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advisor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));

    // Expertise filter
    const matchesExpertise = selectedExpertise.length === 0 ||
      selectedExpertise.some(exp => advisor.expertise.includes(exp));

    // Availability filter (only when toggle is ON)
    const matchesAvailability = !availableOnlyFilter || 
      (advisor.availability === "available" || advisor.availability === "limited");

    return matchesSearch && matchesExpertise && matchesAvailability;
  });

  const toggleExpertise = (expertise: string) => {
    setSelectedExpertise(prev =>
      prev.includes(expertise) ? prev.filter(e => e !== expertise) : [...prev, expertise]
    );
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-400";
      case "limited":
        return "bg-yellow-400";
      case "unavailable":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "limited":
        return "Limited Availability";
      case "unavailable":
        return "Unavailable";
      default:
        return "Unknown";
    }
  };

  const handleSendRequest = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setSelectedProject(null);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = () => {
    if (myProjects.length === 0) {
      setShowRequestModal(false);
      toast.error("No Projects Found", {
        description: "Please create a project first before sending advisor requests.",
        duration: 4000,
        className: "bg-red-500/90 backdrop-blur-xl text-white border-red-400/50"
      });
      return;
    }

    if (!selectedProject || !selectedAdvisor) {
      return;
    }

    // Update the project to add this advisor to requestedAdvisors
    setMyProjects(myProjects.map(project => 
      project.id === selectedProject 
        ? { ...project, requestedAdvisors: [...(project.requestedAdvisors || []), selectedAdvisor.id] }
        : project
    ));

    setShowRequestModal(false);
    setSelectedProject(null);
    
    toast.success("Request Sent!", {
      description: `Your request has been sent to ${selectedAdvisor.name}.`,
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  // Check if a project already has a request to a specific advisor
  const hasRequestToAdvisor = (project: Project, advisorId: number): boolean => {
    return project.requestedAdvisors?.includes(advisorId) || false;
  };

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
            {/* Modal Header */}
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
                            <p className="text-white/50 text-sm mt-1">{project.status}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitRequest}
                  disabled={!selectedProject}
                  className={`w-full px-8 py-5 rounded-[30px] font-bold text-lg transition-all ${
                    selectedProject
                      ? "bg-white hover:bg-white/95 text-gray-900 shadow-2xl hover:shadow-xl cursor-pointer"
                      : "bg-white/20 text-white/40 cursor-not-allowed"
                  }`}
                >
                  Send Request
                </button>
              </>
            ) : (
              // Error State - No Projects
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
