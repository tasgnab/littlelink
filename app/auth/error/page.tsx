"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "An unknown error occurred.";
  if (error === "AccessDenied") {
    errorMessage = "You are not authorized to access this application.";
  } else if (error === "Configuration") {
    errorMessage = "There is a problem with the server configuration.";
  } else if (error === "Verification") {
    errorMessage = "The verification token has expired or has already been used.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500 dark:from-red-900 dark:to-orange-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Authentication Error
          </h1>
        </div>

        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6">
          {errorMessage}
        </div>

        <Link
          href="/auth/signin"
          className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
