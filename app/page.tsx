"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  return (
    <main
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="min-h-screen bg-black/60 flex flex-col">

        <section className="flex flex-col items-center justify-center flex-1 px-6 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Landslide Early Warning System
          </h1>

          <div className="w-24 h-1 bg-blue-500 mb-6 rounded-full"></div>

          <p className="max-w-2xl text-slate-200 mb-10">
            A web-based prototype that monitors soil moisture levels using
            IoT sensors and provides early warnings for landslide risks.
          </p>

          {!user ? (
            <Link
              href="/login"
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
            >
              Sign in with Google
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition font-medium"
            >
              Go to Dashboard
            </Link>
          )}
        </section>

        <footer className="py-6 text-center text-sm text-slate-300 bg-black/80">
          © {new Date().getFullYear()} Landslide Early Warning System
        </footer>
      </div>
    </main>
  );
}
