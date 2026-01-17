// frontend/src/app/signin/page.js
"use client";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Mail, Shield, Sparkles } from "lucide-react";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Sign out first to ensure fresh session
      await signOut(auth);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log(user);
      if (!user.email.endsWith("@iiti.ac.in")) {
        await signOut(auth);
        setError(
          "Access Restricted: Please use your college email (@iiti.ac.in)"
        );
        setIsLoading(false);
        return;
      }

      const token = await user.getIdToken(true);
      // console.log(token);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Backend verification failed. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login Failed", error);
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white overflow-hidden relative">
      {/* --- Background Gradients --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* --- Navbar --- */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-2xl tracking-tighter hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          Learnix<span className="text-indigo-500">.</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      {/* --- Main Content --- */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-20" />

            <div className="relative rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-6 shadow-lg shadow-indigo-500/25"
                >
                  <Zap className="w-8 h-8 text-white fill-white" />
                </motion.div>

                <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                <p className="text-gray-400">
                  Sign in to continue your learning journey
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Sign In Button */}
              <motion.button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 rounded-xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Institution Only
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white mb-1">
                      IIT Indore Students Only
                    </p>
                    <p className="text-xs text-gray-400">
                      Please use your @iiti.ac.in email address to sign in.
                      Other email domains are not permitted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features below card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            <FeaturePill icon={<Shield className="w-4 h-4" />} label="Secure" />
            <FeaturePill icon={<Zap className="w-4 h-4" />} label="Fast" />
            <FeaturePill
              icon={<Sparkles className="w-4 h-4" />}
              label="AI Powered"
            />
          </motion.div>

          {/* Footer text */}
          <p className="text-center text-gray-500 text-sm mt-8">
            By signing in, you agree to our{" "}
            <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">
              Privacy Policy
            </span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function FeaturePill({ icon, label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}
