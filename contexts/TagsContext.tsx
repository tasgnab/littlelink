"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsContextType {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  refetchTags: () => Promise<void>;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  removeTag: (id: string) => void;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export function TagsProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tags");

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (err: any) {
      console.error("Error fetching tags:", err);
      setError(err.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Add a new tag to the context
  const addTag = (tag: Tag) => {
    setTags((prev) => [...prev, tag]);
  };

  // Update a tag in the context
  const updateTag = (id: string, updates: Partial<Tag>) => {
    setTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag))
    );
  };

  // Remove a tag from the context
  const removeTag = (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  };

  const value: TagsContextType = {
    tags,
    loading,
    error,
    refetchTags: fetchTags,
    addTag,
    updateTag,
    removeTag,
  };

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTags() {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error("useTags must be used within a TagsProvider");
  }
  return context;
}
