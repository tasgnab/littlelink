"use client";

import { useState, useEffect } from "react";

interface IndividualTagAnalytics {
  tagId: string;
  tagName: string;
  tagColor: string;
  totalClicks: number;
  linksCount: number;
  clickTrend: { date: string; clicks: number }[];
  topLinks: { linkId: string; shortCode: string; title: string | null; clicks: number }[];
  deviceStats: { device: string; clicks: number; percentage: number }[];
  browserStats: { browser: string; clicks: number; percentage: number }[];
  osStats: { os: string; clicks: number; percentage: number }[];
  topCountries: { country: string; clicks: number }[];
  recentClicks: {
    id: string;
    timestamp: string;
    device: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    city: string | null;
    shortCode: string;
  }[];
}

interface TagAnalyticsModalProps {
  tagId: string;
  tagName: string;
  tagColor: string;
  onClose: () => void;
}

export default function TagAnalyticsModal({
  tagId,
  tagName,
  tagColor,
  onClose
}: TagAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<IndividualTagAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [tagId, days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/analytics/tags/${tagId}?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch analytics");
      }

      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStats = (
    stats: { device: string; clicks: number; percentage: number }[] |
          { browser: string; clicks: number; percentage: number }[] |
          { os: string; clicks: number; percentage: number }[],
    title: string,
    color: string
  ) => {
    if (stats.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
      );
    }

    return (
      <div className="space-y-3">
        {stats.map((stat: any, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-900 dark:text-white capitalize">
                {stat.device || stat.browser || stat.os}
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.clicks} ({stat.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tagColor }}
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Analytics for {tagName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click statistics and insights for this tag
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 mb-6">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  days === d
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Last {d} days
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading analytics...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          {!loading && !error && analytics && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {analytics.totalClicks}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total Clicks
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {analytics.linksCount}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Links with Tag
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {analytics.linksCount > 0
                        ? Math.round(analytics.totalClicks / analytics.linksCount)
                        : 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Avg Clicks/Link
                    </div>
                  </div>
                </div>
              </div>

              {/* Click Trend Chart */}
              {analytics.clickTrend.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Click Trend
                  </h3>
                  <div className="h-40 flex items-end justify-between gap-1">
                    {analytics.clickTrend.map((point, i) => {
                      const maxClicks = Math.max(...analytics.clickTrend.map(t => t.clicks), 1);
                      const height = (point.clicks / maxClicks) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t hover:opacity-80 transition-opacity relative group"
                          style={{
                            height: `${height}%`,
                            minHeight: point.clicks > 0 ? '4px' : '0',
                            backgroundColor: tagColor,
                          }}
                          title={`${point.date}: ${point.clicks} clicks`}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {new Date(point.date).toLocaleDateString()}: {point.clicks}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{analytics.clickTrend[0]?.date ? new Date(analytics.clickTrend[0].date).toLocaleDateString() : ''}</span>
                    <span>{analytics.clickTrend[analytics.clickTrend.length - 1]?.date ? new Date(analytics.clickTrend[analytics.clickTrend.length - 1].date).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              )}

              {/* Top Links */}
              {analytics.topLinks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Top Links
                  </h3>
                  <div className="space-y-2">
                    {analytics.topLinks.map((link, i) => (
                      <div
                        key={link.linkId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              /{link.shortCode}
                            </p>
                            {link.title && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {link.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {link.clicks}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Devices
                  </h3>
                  {renderStats(analytics.deviceStats, "Devices", "bg-blue-500 dark:bg-blue-600")}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Browsers
                  </h3>
                  {renderStats(analytics.browserStats, "Browsers", "bg-purple-500 dark:bg-purple-600")}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Operating Systems
                  </h3>
                  {renderStats(analytics.osStats, "Operating Systems", "bg-green-500 dark:bg-green-600")}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Top Countries
                  </h3>
                  {analytics.topCountries.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
                  ) : (
                    <div className="space-y-2">
                      {analytics.topCountries.map((country, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {country.country}
                          </span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {country.clicks}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Clicks */}
              {analytics.recentClicks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Clicks (Last 50)
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Time
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Link
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Device
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Browser
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              OS
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Location
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {analytics.recentClicks.map((click) => (
                            <tr key={click.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                                {new Date(click.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                /{click.shortCode}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300 capitalize">
                                {click.device || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                {click.browser || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                {click.os || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                {click.city && click.country
                                  ? `${click.city}, ${click.country}`
                                  : click.country || "Unknown"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
