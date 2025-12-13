import { clientConfig } from "@/lib/config";
import { getBrandColors, getFaviconUrl } from "@/lib/utils";
import Image from "next/image";

interface LinktreeLink {
    shortCode: string;
    originalUrl: string;
    title: string | null;
}

interface LandingPageProps {
    links: LinktreeLink[];
}

export default function LandingPage({ links }: LandingPageProps) {
    const gravatarUrl = clientConfig.gravatar;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
            <article className="max-w-2xl mx-auto px-4 py-6 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl">
                {/* Header */}
                <div className="text-center mb-6">
                    {gravatarUrl ? (
                        <div className="mb-3 inline-block">
                            <Image
                                src={gravatarUrl}
                                alt="Profile"
                                width={80}
                                height={80}
                                className="rounded-full shadow-lg border-4 border-white dark:border-gray-700"
                                priority
                            />
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mb-3 shadow-lg">
                            <svg
                                className="w-8 h-8 text-white"
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
                    )}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {clientConfig.title}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {clientConfig.tagline}
                    </p>
                </div>
                {/* Links */}
                <div className="space-y-2 max-w-sm mx-auto">
                        {links.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No links available yet.
                                </p>
                            </div>
                        ) : (
                            links.map((link: LinktreeLink) => {
                                const brandColors = getBrandColors(link.originalUrl);
                                return (
                                    <a
                                        key={link.shortCode}
                                        href={`/${link.shortCode}`}
                                        className="block w-full rounded-lg p-2 hover:shadow-lg transition-all duration-200 group border-2 border-transparent hover:brightness-110"
                                        style={{
                                            background: brandColors.bg,
                                            color: brandColors.text,
                                        }}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-center">
                                            <Image
                                                src={getFaviconUrl(link.originalUrl, 24)}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="rounde"
                                                unoptimized
                                            />
                                            <div>
                                                <h3 className="text-sm font-semibold transition-colors">
                                                    {link.title || link.shortCode}
                                                </h3>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })
                        )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        © 2025 Thopo Akbar. All rights reserved.
                    </p>
                </div>
            </article>
        </div>
    );
}