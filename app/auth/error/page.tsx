export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">
            You are not authorized to access this application.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Please contact the administrator if you believe this is an error.
          </p>
        </div>
      </div>
    </div>
  );
}
