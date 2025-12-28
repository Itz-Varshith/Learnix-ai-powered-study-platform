// frontend/src/app/page.js
"use client";
import { signInWithPopup, signOut } from "firebase/auth"; 
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email.endsWith("@iiti.ac.in")) {
        await signOut(auth);
        alert("Access Restricted: Please use your college email (@iiti.ac.in)");
        return; 
      }

      const token = await user.getIdToken();

      const res = await fetch("http://localhost:9000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Backend verification failed.");
      }

    } catch (error) {
      console.error("Login Failed", error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg border">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        <button 
          onClick={handleGoogleLogin}
          className="mt-6 w-full border py-2 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2"
        >
          Sign in with IITI Email
        </button>
      </div>
    </main>
  );
}