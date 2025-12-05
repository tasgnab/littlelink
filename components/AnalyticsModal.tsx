"use client";

import { useState, useEffect } from "react";

interface Analytics {
  totalClicks: number;
  deviceStats: Record<string, number>;
  browserStats: Record<string, number>;
  osStats: Record<string, number>;
  recentClicks: Array<{
    id: string;
    timestamp: string;
    device: string | null;
    browser: string | null;
    os: string | null;
    referer: string | null;
    country: string | null;
    city: string | null;
  }>;
}

interface AnalyticsModalProps {
  linkId: string;
  shortCode: string;
  onClose: () => void;
}

export default function AnalyticsModal({ linkId, shortCode, onClose }: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [linkId, days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/analytics/${linkId}?days=${days}`);
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

  const renderStats = (stats: Record<string, number>, title: string) => {
    const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {key}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(value / analytics!.totalClicks) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Analytics for /{shortCode}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Click statistics and insights
              </p>
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
              {/* Total Clicks */}
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

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Devices
                  </h3>
                  {renderStats(analytics.deviceStats, "Devices")}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Browsers
                  </h3>
                  {renderStats(analytics.browserStats, "Browsers")}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Operating Systems
                  </h3>
                  {renderStats(analytics.osStats, "Operating Systems")}
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
