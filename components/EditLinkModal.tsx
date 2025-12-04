"use client";

import { useState, useEffect } from "react";

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
  tags: Tag[];
}

interface EditLinkModalProps {
  link: Link;
  onClose: () => void;
  onSave: () => void;
}

export default function EditLinkModal({ link, onClose, onSave }: EditLinkModalProps) {
  const [url, setUrl] = useState(link.originalUrl);
  const [title, setTitle] = useState(link.title || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(link.tags.map((t) => t.name));
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      setAvailableTags(data.tags || []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          title: title || undefined,
          tags: selectedTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update link");
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Link</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Short Code
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 text-sm">
                /{link.shortCode}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Short codes cannot be changed</p>
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Long URL *
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Title (optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                >
                  Add
                </button>
              </div>
              {availableTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Quick add:</span>
                  {availableTags
                    .filter((t) => !selectedTags.includes(t.name))
                    .slice(0, 5)
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAddTag(tag.name)}
                        className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
