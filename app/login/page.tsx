"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data().role : "user";

        router.replace(
          role === "admin" ? "/admin/dashboard" : "/dashboard"
        );
      }
    });

    return () => unsub();
  }, [router]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Save / update user role
    await setDoc(
      doc(db, "users", user.uid),
      {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        role:
          user.email === "cymondleigh@gmail.com"
            ? "admin"
            : "user",
      },
      { merge: true }
    );

    // Redirect immediately
    router.replace(
      user.email === "cymondleigh@gmail.com"
        ? "/admin/dashboard"
        : "/dashboard"
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">
          Landslide Alert System
        </h1>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition"
        >
          Sign in with Google
        </button>

        <p className="text-sm text-center text-gray-500 mt-4">
          Authorized users only
        </p>
      </div>
    </main>
  );
}
