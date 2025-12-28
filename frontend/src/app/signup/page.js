import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg border">
        <h2 className="text-2xl font-bold text-center">Create Account</h2>

        <button className="mt-6 w-full border py-2 rounded-md hover:bg-gray-100">
          Sign up with Google
        </button>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/signin" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
