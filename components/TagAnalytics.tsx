"use client";

import { useState, useEffect } from "react";

interface TagAnalyticsData {
  tagId: string;
  tagName: string;
  tagColor: string;
  totalClicks: number;
  linksCount: number;
  clickTrend: { date: string; clicks: number }[];
}

interface TagAnalyticsProps {
  days?: number;
}

export default function TagAnalytics({ days = 30 }: TagAnalyticsProps) {
  const [analytics, setAnalytics] = useState<TagAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(days);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/tags?days=${selectedPeriod}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch tag analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate sparkline path for mini chart
  const getSparklinePath = (trend: { date: string; clicks: number }[]) => {
    if (!trend || trend.length === 0) return "";

    const maxClicks = Math.max(...trend.map(t => t.clicks), 1);
    const width = 100;
    const height = 30;

    const points = trend.map((point, i) => {
      const x = (i / (trend.length - 1)) * width;
      const y = height - (point.clicks / maxClicks) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tag Analytics
        </h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading analytics...
        </div>
      ) : analytics.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tags found. Create some tags to see analytics.
        </div>
      ) : (
        <div className="space-y-3">
          {analytics.slice(0, 10).map((tag) => (
            <div
              key={tag.tagId}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.tagColor }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tag.tagName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tag.linksCount} {tag.linksCount === 1 ? 'link' : 'links'}
                  </p>
                </div>
              </div>

              {/* Sparkline */}
              {tag.clickTrend.length > 0 && (
                <div className="w-24 h-8 mr-4">
                  <svg width="100" height="30" className="overflow-visible">
                    <path
                      d={getSparklinePath(tag.clickTrend)}
                      fill="none"
                      stroke={tag.tagColor}
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  </svg>
                </div>
              )}

              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {tag.totalClicks}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">clicks</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
