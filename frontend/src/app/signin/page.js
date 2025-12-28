import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg border">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>

        <button className="mt-6 w-full border py-2 rounded-md hover:bg-gray-100">
          Sign in with Google
        </button>

        <p className="mt-6 text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
