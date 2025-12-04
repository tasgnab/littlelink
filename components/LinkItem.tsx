"use client";

import { useState } from "react";

interface LinkItemProps {
  link: any;
  onDeleted: () => void;
}

export default function LinkItem({ link, onDeleted }: LinkItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [copied, setCopied] = useState(false);

  const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${link.shortCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      }
    } catch (error) {
      console.error("Error deleting link:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowQR = async () => {
    if (!qrCode) {
      try {
        const res = await fetch(`/api/links/${link.id}/qr`);
        const data = await res.json();
        setQrCode(data.qrCode);
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    }
    setShowQR(!showQR);
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {link.title || link.shortCode}
            </h3>
            {!link.isActive && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                Inactive
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Short URL:</span>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Original:</span>
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 truncate max-w-md"
              >
                {link.originalUrl}
              </a>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Clicks: {link.clicks}</span>
              <span>
                Created: {new Date(link.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShowQR}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            QR Code
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {showQR && qrCode && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-center">
          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
        </div>
      )}
    </div>
  );
}
