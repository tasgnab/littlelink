"use client";

import { useState, useEffect } from "react";

interface GlobalAnalyticsData {
  overview: {
    totalLinks: number;
    totalClicks: number;
    activeLinks: number;
    uniqueDevices: number;
    uniqueCountries: number;
  };
  clickTrend: { date: string; clicks: number }[];
  topCountries: { country: string; clicks: number }[];
  topCities: { city: string; country: string; clicks: number }[];
  deviceStats: { device: string; clicks: number; percentage: number }[];
  browserStats: { browser: string; clicks: number; percentage: number }[];
  osStats: { os: string; clicks: number; percentage: number }[];
}

interface GlobalAnalyticsModalProps {
  onClose: () => void;
}

export default function GlobalAnalyticsModal({ onClose }: GlobalAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<GlobalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'geography' | 'devices' | 'browsers' | 'os'>('geography');

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/analytics/global?days=${days}`);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Global Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Analytics across all your links
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
              {/* Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.totalLinks}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total Links
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.totalClicks}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Total Clicks
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.activeLinks}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Active Links
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.uniqueDevices}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Devices
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {analytics.overview.uniqueCountries}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Countries
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
                          className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors relative group"
                          style={{ height: `${height}%`, minHeight: point.clicks > 0 ? '4px' : '0' }}
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

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('geography')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'geography'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Geography
                  </button>
                  <button
                    onClick={() => setActiveTab('devices')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'devices'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Devices
                  </button>
                  <button
                    onClick={() => setActiveTab('browsers')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'browsers'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Browsers
                  </button>
                  <button
                    onClick={() => setActiveTab('os')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'os'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Operating Systems
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="pt-2">
                {activeTab === 'geography' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Countries */}
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

                    {/* Cities */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        Top Cities
                      </h3>
                      {analytics.topCities.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
                      ) : (
                        <div className="space-y-2">
                          {analytics.topCities.map((city, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {city.city}, {city.country}
                              </span>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {city.clicks}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'devices' && (
                  <div className="space-y-3">
                    {analytics.deviceStats.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
                    ) : (
                      analytics.deviceStats.map((device, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-900 dark:text-white capitalize">
                              {device.device}
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {device.clicks} ({device.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'browsers' && (
                  <div className="space-y-3">
                    {analytics.browserStats.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
                    ) : (
                      analytics.browserStats.map((browser, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {browser.browser}
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {browser.clicks} ({browser.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-500 dark:bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${browser.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'os' && (
                  <div className="space-y-3">
                    {analytics.osStats.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
                    ) : (
                      analytics.osStats.map((os, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {os.os}
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {os.clicks} ({os.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 dark:bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${os.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
