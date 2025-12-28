import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center text-center px-6">
      <section className="mt-24 max-w-3xl">
        <h1 className="text-4xl font-bold leading-tight">
          Study smarter, not harder.
        </h1>

        <p className="mt-4 text-gray-600">
          Learnix helps engineering students organize resources, revise faster,
          and prepare efficiently with AI-powered tools.
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 bg-black text-white rounded-md"
          >
            Get Started
          </Link>

          <Link
            href="/signin"
            className="px-6 py-3 border rounded-md"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <Feature
          title="Centralized Resources"
          desc="All notes, PDFs, and previous year papers in one place."
        />
        <Feature
          title="AI-powered Revision"
          desc="Summaries, flashcards, and demo quizzes generated instantly."
        />
        <Feature
          title="Exam-focused Design"
          desc="Built specifically for engineering students and semesters."
        />
      </section>
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
