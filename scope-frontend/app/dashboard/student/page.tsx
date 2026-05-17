"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface FeedItem {
  id: number;
  type: "project";
  title: string;
  description: string;
  fullDescription?: string;
  date: string;
  category: string;
  author: string;
}

export default function StudentMyHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Admin Announcements (Project Announcements)
  // TODO: Connect to backend API for admin announcements
  const adminAnnouncements: FeedItem[] = [
    {
      id: 1,
      type: "project",
      title: "TÜBİTAK 2209-A Support Programme Open",
      description: "Applications are now open for undergraduate research project support.",
      fullDescription: "Applications are now open for undergraduate research project support. The TÜBİTAK 2209-A programme provides funding for innovative student-led research projects. Students can apply individually or in teams. The deadline for submissions is April 30th, 2026. Successful applicants will receive up to 15,000 TL in funding, mentorship from faculty advisors, and access to research facilities. Projects must demonstrate originality, feasibility, and potential for scientific contribution.",
      date: "March 20, 2026",
      category: "TÜBİTAK",
      author: "Admin"
    },
    {
      id: 3,
      type: "project",
      title: "Teknofest 2026 Team Formation Deadline",
      description: "Teams must be finalized by April 1st for Teknofest competition entries.",
      fullDescription: "Teams must be finalized by April 1st for Teknofest competition entries. Teknofest is Turkey's premier aerospace and technology festival, featuring competitions in AI, robotics, autonomous systems, and more. Teams of 3-5 students are required. All team members must register on the official Teknofest portal. Competition categories include autonomous vehicles, smart transportation, agricultural technology, and satellite design. Winners receive scholarships, internship opportunities, and funding for prototype development.",
      date: "March 18, 2026",
      category: "Teknofest",
      author: "Admin"
    },
    {
      id: 5,
      type: "project",
      title: "Spring Semester Course Projects Announced",
      description: "New course project topics are available for CS401 and CS402.",
      fullDescription: "New course project topics are available for CS401 (Advanced Software Engineering) and CS402 (Machine Learning Applications). Students must form teams of 2-4 members and select a project topic by March 28th. CS401 projects focus on full-stack web development, microservices architecture, and DevOps practices. CS402 projects involve building ML models for real-world applications such as image recognition, natural language processing, or predictive analytics. All projects require weekly progress reports and a final presentation in May.",
      date: "March 15, 2026",
      category: "Course",
      author: "Admin"
    },
  ];

  // Filter based on search
  const filteredAnnouncements = adminAnnouncements.filter(item =>
    searchQuery === "" ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Hub</h1>
        <p className="text-white/60 text-lg">Stay updated with the latest announcements and opportunities</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all text-lg"
          />
        </div>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        {filteredAnnouncements.map((item) => {
          const isExpanded = expandedCard === item.id;

          return (
            <div
              key={item.id}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10 hover:bg-white/15 transition-all duration-500 ease-in-out"
              style={{
                maxHeight: isExpanded ? "1000px" : "320px",
                overflow: "hidden",
                transitionProperty: "max-height",
                transitionDuration: "500ms",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-5 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-200 rounded-full text-sm font-medium border border-blue-400/30">
                  {item.category}
                </span>
                <span className="text-white/50 text-sm">{item.date}</span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>

              {/* Description */}
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                {isExpanded ? item.fullDescription : item.description}
              </p>

              {/* Author */}
              <p className="text-white/50 text-sm mb-6">Posted by {item.author}</p>

              {/* View Details Button */}
              <button
                type="button"
                onClick={() => toggleExpand(item.id)}
                className="flex items-center space-x-2 px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Show less details" : "Show more details"}
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
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAnnouncements.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">No announcements found</p>
        </div>
      )}
    </div>
  );
}
