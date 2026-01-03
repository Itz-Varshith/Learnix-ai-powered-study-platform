'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Bot, 
  BrainCircuit, 
  Library, 
  Timer, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Users,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* --- Background Gradients --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* --- Navbar --- */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          Learnix<span className="text-indigo-500">.</span>
        </div>
        <div className="flex gap-4">
          <Link href="/signin" className="hidden md:flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/signin" className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-indigo-50 transition-all flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="relative z-10 px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Now with AI Doubt Solver & Focus Timer</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Study smarter, not <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient bg-300%">
              just harder.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one workspace for engineering students. Organize notes, generate AI summaries, solve doubts instantly, and track your focus—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signin" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2">
              Start Learning Free
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center">
              View Features
            </Link>
          </div>
        </motion.div>

        {/* Hero Visual / Mockup Placeholder */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3, duration: 0.8 }}
           className="mt-20 relative mx-auto max-w-4xl"
        >
          <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-20" />
          <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden shadow-2xl">
             <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
             </div>
             {/* Abstract UI Representation */}
             <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mock Sidebar */}
                <div className="hidden md:flex flex-col gap-4">
                   <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
                   <div className="h-4 w-1/2 bg-white/5 rounded" />
                   <div className="h-4 w-2/3 bg-white/5 rounded" />
                   <div className="h-4 w-1/2 bg-white/5 rounded" />
                </div>
                {/* Mock Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="h-32 w-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl border border-white/10 p-6 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white/50">Your Dashboard</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-white/5 rounded-xl" />
                      <div className="h-24 bg-white/5 rounded-xl" />
                    </div>
                </div>
             </div>
          </div>
        </motion.div>
      </main>

      {/* --- Bento Grid Features Section --- */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <br /><span className="text-indigo-400">ace the semester</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Stop juggling 5 different apps. Learnix combines resources, AI tools, and task management into one cohesive student OS.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-rows-[auto_auto]">
            
            {/* Feature 1: Large Card (AI Chat) */}
            <BentoCard 
              className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-black"
              icon={<Bot className="w-8 h-8 text-indigo-400" />}
              title="AI Doubt Solver"
              desc="Stuck on a concept? Chat with our AI tutor trained on your specific course material. It understands context and gives instant, accurate explanations."
            />

            {/* Feature 2: Standard Card (Resources) */}
            <BentoCard 
              className="bg-black/40"
              icon={<Library className="w-8 h-8 text-purple-400" />}
              title="Course Hub"
              desc="Access all your PDFs, lecture notes, and previous year papers in one organized, searchable dashboard."
            />

            {/* Feature 3: Standard Card (Focus) */}
            <BentoCard 
              className="bg-black/40"
              icon={<Timer className="w-8 h-8 text-pink-400" />}
              title="Focus Sessions"
              desc="Built-in Pomodoro timer with study tracking. Block distractions and log your deep work hours."
            />

             {/* Feature 4: Large Card (Revision) */}
             <BentoCard 
              className="md:col-span-2 bg-gradient-to-br from-purple-900/40 to-black"
              icon={<BrainCircuit className="w-8 h-8 text-purple-400" />}
              title="AI Revision Tools"
              desc="Turn boring lecture notes into interactive Flashcards and Practice Quizzes instantly. Active recall made effortless."
            />
          </div>
        </div>
      </section>

      {/* --- Stats / Social Proof --- */}
      <section className="py-20 border-y border-white/5 bg-white/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Stat number="10+" label="Engineering Courses" />
            <Stat number="24/7" label="AI Availability" />
            <Stat number="0s" label="Distraction" />
            <Stat number="100%" label="Free for Students" />
        </div>
      </section>

      {/* --- Final CTA --- */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Ready to upgrade your GPA?</h2>
          <p className="text-gray-400 mb-10">Join the platform built specifically for the modern engineering student.</p>
          <Link href="/signin" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-lg">
             Get Started Now <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Learnix. Built for Students.</p>
      </footer>

    </div>
  );
}

// --- Sub-components for Cleaner Code ---

function BentoCard({ className, icon, title, desc }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-8 rounded-3xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors group ${className}`}
    >
      <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function Stat({ number, label }) {
    return (
        <div>
            <div className="text-4xl font-bold text-white mb-2">{number}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</div>
        </div>
    )
}