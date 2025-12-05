"use client";

import { useState, useEffect } from "react";
import EditLinkModal from "./EditLinkModal";
import AnalyticsModal from "./AnalyticsModal";
import { getAppUrl } from "@/lib/config";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Link {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  clicks: number;
  isActive: boolean;
  createdAt: string;
  tags: Tag[];
}

interface LinksTableProps {
  refreshTrigger: number;
  selectedTag: string | null;
}

export default function LinksTable({ refreshTrigger, selectedTag }: LinksTableProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [analyticsLink, setAnalyticsLink] = useState<Link | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLinks, setTotalLinks] = useState(0);
  const pageSize = 10;

  const totalPages = Math.ceil(totalLinks / pageSize);

  useEffect(() => {
    fetchLinks();
  }, [refreshTrigger, currentPage]);

  useEffect(() => {
    // Reset to page 1 when tag filter changes
    setCurrentPage(1);
  }, [selectedTag]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });

      if (selectedTag) {
        params.append("tag", selectedTag);
      }

      const response = await fetch(`/api/links?${params}`);
      const data = await response.json();
      setLinks(data.links);
      setTotalLinks(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch links:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (shortCode: string) => {
    const url = `${getAppUrl()}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(shortCode);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchLinks();
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    try {
      await fetch(`/api/links/${id}`, { method: "DELETE" });
      fetchLinks();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const removeTagFromLink = async (link: Link, tagToRemove: Tag) => {
    if (!confirm(`Remove tag "${tagToRemove.name}" from this link?`)) {
      return;
    }

    try {
      const remainingTags = link.tags
        .filter((tag) => tag.id !== tagToRemove.id)
        .map((tag) => tag.name);

      await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: remainingTags }),
      });
      fetchLinks();
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {selectedTag ? `No links with tag "${selectedTag}"` : "No links yet"}
      </div>
    );
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Short URL
                </th>
                <th className="w-[35%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Original URL
                </th>
                <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tags
                </th>
                <th className="w-[8%] px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-[11%] px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(link.shortCode)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-2"
                      >
                        /{link.shortCode}
                        {copied === link.shortCode ? (
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {link.title && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={link.title}>{link.title}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white truncate block"
                      title={link.originalUrl}
                    >
                      {link.originalUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {link.tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => removeTagFromLink(link, tag)}
                          className="relative inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium group overflow-hidden transition-all hover:px-3"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                          title="Click to remove tag"
                        >
                          <span className="group-hover:opacity-0 transition-opacity duration-200">{tag.name}</span>
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </span>
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{link.clicks}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(link.id, link.isActive)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        link.isActive
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {link.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setAnalyticsLink(link)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        title="View analytics"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingLink(link)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Edit link"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Delete link"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalLinks)} of {totalLinks} links
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  const showEllipsis =
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2);

                  if (showEllipsis) {
                    return (
                      <span key={page} className="px-2 text-gray-500 dark:text-gray-400">
                        ...
                      </span>
                    );
                  }

                  if (!showPage) {
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSave={() => {
            setEditingLink(null);
            fetchLinks();
          }}
        />
      )}

      {analyticsLink && (
        <AnalyticsModal
          linkId={analyticsLink.id}
          shortCode={analyticsLink.shortCode}
          onClose={() => setAnalyticsLink(null)}
        />
      )}
    </>
  );
}
