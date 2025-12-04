"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import CreateLinkForm from "./CreateLinkForm";
import LinksTable from "./LinksTable";
import TagsSidebar from "./TagsSidebar";
import Stats from "./Stats";

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleLinkCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">LittleLink</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-9 h-9 rounded-full border border-gray-200"
                />
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-6">
          <Stats />
        </div>

        {/* Create Link Form */}
        <div className="mb-6">
          <CreateLinkForm onLinkCreated={handleLinkCreated} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TagsSidebar
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedTag ? `Links tagged with "${selectedTag}"` : "All Links"}
              </h2>
            </div>
            <LinksTable
              refreshTrigger={refreshTrigger}
              selectedTag={selectedTag}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
