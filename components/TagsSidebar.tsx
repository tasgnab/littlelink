"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import TagAnalyticsModal from "./TagAnalyticsModal";
import GlobalAnalyticsModal from "./GlobalAnalyticsModal";

interface TagsSidebarProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onTagDeleted?: () => void;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function TagsSidebar({ selectedTag, onSelectTag, onTagDeleted }: TagsSidebarProps) {
  const { tags, updateTag, removeTag } = useApp();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [analyticsTag, setAnalyticsTag] = useState<Tag | null>(null);
  const [showGlobalAnalytics, setShowGlobalAnalytics] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEditClick = (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError("");
  };

  const handleAnalyticsClick = (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnalyticsTag(tag);
  };

  const handleDeleteClick = async (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete tag");
      }

      removeTag(tag.id);

      // Clear selected tag if it was deleted
      if (selectedTag === tag.name) {
        onSelectTag(null);
      }

      // Notify parent to refresh links
      if (onTagDeleted) {
        onTagDeleted();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTag) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          color: editColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update tag");
      }

      updateTag(editingTag.id, { name: editName, color: editColor });

      // Update selected tag if it was renamed
      if (selectedTag === editingTag.name) {
        onSelectTag(editName);
      }

      setEditingTag(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Filter by Tag</h3>
        <div className="space-y-1">
          <div className="relative group">
            <button
              onClick={() => onSelectTag(null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedTag === null
                  ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="pr-8 group-hover:pr-0">All Links</span>
            </button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-white dark:bg-gray-800 rounded px-0.5 shadow-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGlobalAnalytics(true);
                }}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                title="View global analytics"
              >
                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>
          {tags.map((tag) => (
            <div key={tag.id} className="relative group">
              <button
                onClick={() => onSelectTag(tag.name)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  selectedTag === tag.name
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 truncate pr-14 group-hover:pr-0">{tag.name}</span>
              </button>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded px-0.5 shadow-sm">
                <button
                  onClick={(e) => handleAnalyticsClick(tag, e)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                  title="View analytics"
                >
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleEditClick(tag, e)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Edit tag"
                >
                  <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDeleteClick(tag, e)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  title="Delete tag"
                >
                  <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Tag</h2>
                <button
                  onClick={() => setEditingTag(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    id="tagName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="tagColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Color *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="tagColor"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingTag(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading || !editName.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Analytics Modal */}
      {analyticsTag && (
        <TagAnalyticsModal
          tagId={analyticsTag.id}
          tagName={analyticsTag.name}
          tagColor={analyticsTag.color}
          onClose={() => setAnalyticsTag(null)}
        />
      )}

      {/* Global Analytics Modal */}
      {showGlobalAnalytics && (
        <GlobalAnalyticsModal
          onClose={() => setShowGlobalAnalytics(false)}
        />
      )}
    </>
  );
}
