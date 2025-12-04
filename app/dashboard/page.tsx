"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import CreateLinkForm from "@/components/CreateLinkForm";
import LinksList from "@/components/LinksList";
import Stats from "@/components/Stats";

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("links");

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleLinkCreated = () => {
    fetchLinks();
  };

  const handleLinkDeleted = () => {
    fetchLinks();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Link Shortener
              </h1>
              <nav className="hidden md:flex gap-6">
                <button
                  onClick={() => setActiveTab("links")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "links"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Links
                </button>
                <button
                  onClick={() => setActiveTab("api-keys")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "api-keys"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  API Keys
                </button>
              </nav>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "links" && (
          <>
            {/* Stats */}
            <Stats links={links} />

            {/* Create Link Form */}
            <div className="mt-8">
              <CreateLinkForm onLinkCreated={handleLinkCreated} />
            </div>

            {/* Links List */}
            <div className="mt-8">
              <LinksList
                links={links}
                isLoading={isLoading}
                onLinkDeleted={handleLinkDeleted}
              />
            </div>
          </>
        )}

        {activeTab === "api-keys" && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                API Keys
              </h2>
              <p className="text-gray-600 mb-4">
                Manage your API keys for programmatic access to the link
                shortener.
              </p>
              <div className="text-sm text-gray-500">
                API key management coming soon...
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
