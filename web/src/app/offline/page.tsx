import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          You're Offline
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          It looks like you've lost your internet connection. Some features may not be available until you reconnect.
        </p>
        <div className="mb-6">
          <svg className="mx-auto w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <Link 
          href="/"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Try Going Home
        </Link>
      </div>
    </div>
  );
} 