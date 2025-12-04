"use client";

import { useState } from "react";
import LinkItem from "./LinkItem";

interface LinksListProps {
  links: any[];
  isLoading: boolean;
  onLinkDeleted: () => void;
}

export default function LinksList({
  links,
  isLoading,
  onLinkDeleted,
}: LinksListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLinks = links.filter(
    (link) =>
      link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Links</h2>
          <span className="text-sm text-gray-500">{links.length} total</span>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search links..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="divide-y divide-gray-200">
        {filteredLinks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? "No links found matching your search"
              : "No links yet. Create your first one above!"}
          </div>
        ) : (
          filteredLinks.map((link) => (
            <LinkItem key={link.id} link={link} onDeleted={onLinkDeleted} />
          ))
        )}
      </div>
    </div>
  );
}
