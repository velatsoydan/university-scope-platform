"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast, Toaster } from "sonner";

// -----------------------------------------------------------------------------
// API base — env var holds the host (no /api suffix); endpoints below prepend
// /api explicitly to stay consistent with the rest of the app.
// -----------------------------------------------------------------------------
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

// -----------------------------------------------------------------------------
// Types — derived from prisma/schema.prisma (Announcement model)
// -----------------------------------------------------------------------------
interface AnnouncementDTO {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
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

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function StudentMyHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Fetcher — /api/admin/announcements is a public endpoint, but the layout
  // already guarantees a logged-in student is rendering this page, so we
  // attach the bearer token defensively.
  // ---------------------------------------------------------------------------
  const fetchAnnouncements = useCallback(async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/admin/announcements`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Announcements fetch failed (${res.status})`);
    const data = (await res.json()) as { announcements: AnnouncementDTO[] };
    setAnnouncements(data.announcements ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await fetchAnnouncements();
      } catch (err) {
        console.error("Hub load failed:", err);
        toast.error(err instanceof Error ? err.message : "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchAnnouncements]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const filteredAnnouncements = useMemo(() => announcements.filter(item => {
    const q = searchQuery.toLowerCase();
    return searchQuery === "" ||
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
  }), [announcements, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-8">
      <Toaster position="bottom-right" />

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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        </div>
      )}

      {/* Feed Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 max-w-5xl">
          {filteredAnnouncements.map((item) => {
            const isExpanded = expandedCard === item.id;
            const preview = item.content.length > 160
              ? `${item.content.slice(0, 160).trimEnd()}...`
              : item.content;

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
                  <span className="text-white/50 text-sm">{formatDate(item.createdAt)}</span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>

                {/* Description — preview when collapsed, full content when expanded */}
                <p className="text-white/70 text-lg leading-relaxed mb-6">
                  {isExpanded ? item.content : preview}
                </p>

                {/* Author */}
                <p className="text-white/50 text-sm mb-6">Posted by Admin</p>

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
      )}

      {/* Empty State */}
      {!loading && filteredAnnouncements.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">
            {announcements.length === 0
              ? "No announcements yet"
              : "No announcements match your search"}
          </p>
        </div>
      )}
    </div>
  );
}
