"use client";

import { useTags } from "@/contexts/TagsContext";

interface TagsSidebarProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagsSidebar({ selectedTag, onSelectTag }: TagsSidebarProps) {
  const { tags } = useTags();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Filter by Tag</h3>
      <div className="space-y-1">
        <button
          onClick={() => onSelectTag(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selectedTag === null
              ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          All Links
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
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
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
