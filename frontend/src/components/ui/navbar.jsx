"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b bg-white">
      <h1 className="text-xl font-bold">Learnix</h1>

      <div className="flex gap-6 items-center">
        <Link href="/" className="text-sm text-gray-600 hover:text-black">
          Home
        </Link>
        <Link
          href="/signin"
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}
