"use client";

import { useState } from "react";
import { Plus, Users, CheckCircle, Clock, X, Check, Trash2, Edit3, DollarSign, LogOut, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  status: "Advisor Assigned" | "Pending Advisor";
  teamMembers: TeamMember[];
  category: string;
  createdDate: string;
  budget: string;
  isOwner: boolean;
  requiredSkills: string[];
}

export default function StudentMyProjectsAdvanced() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [filterType, setFilterType] = useState<"all" | "owned" | "joined">("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    requiredSkills: "",
    teamSize: "",
    budget: ""
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    budget: "",
    requiredSkills: ""
  });

  // Mock projects (some owned, some joined)
  // TODO: Connect to backend API for user projects
  const [projects, setProjects] = useState<Project[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreateProject = () => {
    if (!formData.title || !formData.description || !formData.category || !formData.budget) {
      return;
    }

    const newProject: Project = {
      id: projects.length + 1,
      title: formData.title,
      description: formData.description,
      status: "Pending Advisor",
      teamMembers: [
        // The project owner will be added from real user data when integrating backend API
      ],
      category: formData.category,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      budget: formData.budget,
      isOwner: true,
      requiredSkills: formData.requiredSkills.split(",").map(s => s.trim()).filter(s => s.length > 0)
    };

    setProjects([...projects, newProject]);
    setShowCreateModal(false);
    showToastNotification("Project Created Successfully!");

    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "",
      requiredSkills: "",
      teamSize: "",
      budget: ""
    });
  };

  const showToastNotification = (message: string) => {
    toast.success(message, {
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleRemoveUser = (memberId: number) => {
    if (!selectedProject) return;

    const updatedMembers = selectedProject.teamMembers.filter(m => m.id !== memberId);
    const updatedProject = { ...selectedProject, teamMembers: updatedMembers };

    // Update in projects list
    setProjects(projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    ));

    setSelectedProject(updatedProject);
    showToastNotification("Team member removed successfully!");
  };

  const handleLeaveProject = () => {
    if (!selectedProject) return;

    // Remove project from list
    setProjects(projects.filter(p => p.id !== selectedProject.id));
    setShowProjectModal(false);
    showToastNotification("You have left the project");
  };

  const handleDeleteProject = () => {
    if (!selectedProject) return;

    setProjects(projects.filter(p => p.id !== selectedProject.id));
    setShowProjectModal(false);
    showToastNotification("Project deleted successfully");
  };

  const handleRoleChange = (memberId: number, newRole: string) => {
    if (!selectedProject) return;

    const updatedMembers = selectedProject.teamMembers.map(m =>
      m.id === memberId ? { ...m, role: newRole } : m
    );
    const updatedProject = { ...selectedProject, teamMembers: updatedMembers };

    setProjects(projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    ));

    setSelectedProject(updatedProject);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditFormData({
      title: project.title,
      description: project.description,
      budget: project.budget,
      requiredSkills: project.requiredSkills.join(", ")
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedProject) return;

    const updatedProject: Project = {
      ...selectedProject,
      title: editFormData.title,
      description: editFormData.description,
      budget: editFormData.budget,
      requiredSkills: editFormData.requiredSkills.split(",").map(s => s.trim()).filter(s => s.length > 0)
    };

    setProjects(projects.map(p =>
      p.id === selectedProject.id ? updatedProject : p
    ));

    setShowEditModal(false);
    setSelectedProject(null);

    toast.success("Project Updated!", {
      description: "Your project and linked team ad have been updated successfully.",
      duration: 4000,
      className: "bg-blue-500/90 backdrop-blur-xl text-white border-blue-400/50"
    });
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (filterType === "owned") return p.isOwner;
    if (filterType === "joined") return !p.isOwner;
    return true;
  });

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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-5 py-2 backdrop-blur-sm rounded-full text-sm font-medium border ${project.status === "Advisor Assigned"
                      ? "bg-green-500/20 text-green-200 border-green-400/30"
                      : "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
                    }`}
                >
                  {project.status === "Advisor Assigned" ? (
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Advisor Assigned</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Pending Advisor</span>
                    </span>
                  )}
                </span>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                  {project.category}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {project.isOwner && (
                  <>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-full text-xs border border-blue-400/30 font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
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
                <span className="text-sm font-medium">{project.teamMembers.length} member{project.teamMembers.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2 text-white/60">
                <DollarSign className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium">{project.budget}</span>
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
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
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
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fadeIn">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">{selectedProject.title}</h2>
                <div className="flex items-center space-x-3">
                  <span className="px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm border border-blue-400/30">
                    {selectedProject.category}
                  </span>
                  <span className="text-white/60 text-sm">Created {selectedProject.createdDate}</span>
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
                  <span className="text-white text-xl font-bold">{selectedProject.budget}</span>
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
                {selectedProject.teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{member.name}</p>
                      <p className="text-white/50 text-sm">{member.email}</p>
                    </div>

                    {selectedProject.isOwner ? (
                      <div className="flex items-center space-x-3">
                        {/* Role Selector for Owner */}
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="px-4 py-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                        >
                          <option value="Project Lead" className="bg-gray-800">Project Lead</option>
                          <option value="Frontend Developer" className="bg-gray-800">Frontend Developer</option>
                          <option value="Backend Developer" className="bg-gray-800">Backend Developer</option>
                          <option value="ML Engineer" className="bg-gray-800">ML Engineer</option>
                          <option value="Designer" className="bg-gray-800">Designer</option>
                          <option value="DevOps" className="bg-gray-800">DevOps</option>
                        </select>

                        {/* Remove Button (only if not self) */}
                        {!member.name.includes("(You)") && (
                          <button
                            onClick={() => handleRemoveUser(member.id)}
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
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {selectedProject.isOwner ? (
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
      )}

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

              {/* Category */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3 ml-2">
                  Project Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg cursor-pointer"
                  required
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  <option value="AI" className="bg-gray-800">AI / Machine Learning</option>
                  <option value="Web" className="bg-gray-800">Web Development</option>
                  <option value="Mobile" className="bg-gray-800">Mobile Development</option>
                  <option value="Robotics" className="bg-gray-800">Robotics</option>
                  <option value="IoT" className="bg-gray-800">IoT</option>
                  <option value="Data Science" className="bg-gray-800">Data Science</option>
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
                  className="flex-1 px-8 py-5 bg-white hover:bg-white/95 text-gray-900 rounded-[30px] font-bold text-lg transition-all shadow-2xl hover:shadow-xl flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                  <span>Create Project</span>
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
                  value={formData.category} // Assuming this might be a typo in the original React code, but leaving it as editFormData conceptually or formData as per original. Let's fix it to editFormData. Wait, original has value={formData.category} and onChange={...handleInputChange("category")}. That means editing category wouldn't work on edit modal. The user wants EXACT translation. I will leave it as formData.category as they instructed "Keep layout, text, colors, and all mock data entirely intact."
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-7 py-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all text-lg cursor-pointer"
                  required
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  <option value="AI" className="bg-gray-800">AI / Machine Learning</option>
                  <option value="Web" className="bg-gray-800">Web Development</option>
                  <option value="Mobile" className="bg-gray-800">Mobile Development</option>
                  <option value="Robotics" className="bg-gray-800">Robotics</option>
                  <option value="IoT" className="bg-gray-800">IoT</option>
                  <option value="Data Science" className="bg-gray-800">Data Science</option>
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
                  className="flex-1 px-8 py-5 bg-white hover:bg-white/95 text-gray-900 rounded-[30px] font-bold text-lg transition-all shadow-2xl hover:shadow-xl flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
