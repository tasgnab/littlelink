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

interface GlobalAnalyticsProps {
  days?: number;
}

export default function GlobalAnalytics({ days = 30 }: GlobalAnalyticsProps) {
  const [analytics, setAnalytics] = useState<GlobalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(days);
  const [activeTab, setActiveTab] = useState<'geography' | 'devices' | 'browsers' | 'os'>('geography');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/global?days=${selectedPeriod}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch global analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Calculate sparkline path for click trend
  const getClickTrendPath = () => {
    if (!analytics.clickTrend || analytics.clickTrend.length === 0) return "";

    const maxClicks = Math.max(...analytics.clickTrend.map(t => t.clicks), 1);
    const width = 100;
    const height = 40;

    const points = analytics.clickTrend.map((point, i) => {
      const x = (i / (analytics.clickTrend.length - 1 || 1)) * width;
      const y = height - (point.clicks / maxClicks) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Global Analytics
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

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.totalLinks}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Links</p>
              </div>

              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-300"
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
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.totalClicks}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Clicks</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.activeLinks}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Links</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.uniqueDevices}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Devices</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-grey-600 dark:text-grey-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.overview.uniqueCountries}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Countries</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Click Trend Chart */}
        {
          analytics.clickTrend.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
          )
        }
      </div >

      {/* Detailed Stats */}
      < div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6" >
        {/* Tabs */}
        < div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700" >
          <button
            onClick={() => setActiveTab('geography')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'geography'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Geography
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'devices'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Devices
          </button>
          <button
            onClick={() => setActiveTab('browsers')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'browsers'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Browsers
          </button>
          <button
            onClick={() => setActiveTab('os')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'os'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Operating Systems
          </button>
        </div >

        {/* Tab Content */}
        {
          activeTab === 'geography' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Countries */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Top Countries
                </h3>
                <div className="space-y-2">
                  {analytics.topCountries.slice(0, 10).map((country, i) => (
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
              </div>

              {/* Cities */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Top Cities
                </h3>
                <div className="space-y-2">
                  {analytics.topCities.slice(0, 10).map((city, i) => (
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
              </div>
            </div>
          )
        }

        {
          activeTab === 'devices' && (
            <div className="space-y-3">
              {analytics.deviceStats.map((device, i) => (
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
              ))}
            </div>
          )
        }

        {
          activeTab === 'browsers' && (
            <div className="space-y-3">
              {analytics.browserStats.map((browser, i) => (
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
              ))}
            </div>
          )
        }

        {
          activeTab === 'os' && (
            <div className="space-y-3">
              {analytics.osStats.map((os, i) => (
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
              ))}
            </div>
          )
        }
      </div >
    </div >
  );
}
