import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DF</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Director Firme</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/sources" className="text-sm text-gray-600 hover:text-gray-900">
            Surse
          </Link>
          <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
            Terms
          </Link>
        </div>
      </div>
    </nav>
  );
}
