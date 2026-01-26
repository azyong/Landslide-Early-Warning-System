"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ================= LOAD USER =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // LOAD PHONE FROM FIRESTORE
      const snap = await getDoc(doc(db, "users", currentUser.uid));

      if (snap.exists()) {
        setPhone(snap.data().phone || "");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // ================= VALIDATION =================
  const isValidPH = (num: string) => {
    return /^09\d{9}$/.test(num);
  };

  // ================= SAVE =================
  const handleSave = async () => {
    setError("");
    setSaved(false);

    if (!isValidPH(phone)) {
      setError("Invalid PH number format. Use 09XXXXXXXXX");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          name: user.displayName || "",
          phone,
        },
        { merge: true }
      );

      setSaved(true);
    } catch (err) {
      setError("Failed to save profile");
      console.error(err);
    }
  };

  // ================= UI =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow border">
        <Link
          href="/dashboard"
          className="inline-block mb-6 text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6">User Profile</h1>

        <div className="mb-6">
          <p className="text-sm text-slate-500">Name</p>
          <p className="font-medium">
            {user.displayName || "No name set"}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Mobile Number (for SMS alerts)
          </label>

          <input
            type="tel"
            placeholder="09XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-3">{error}</p>
        )}

        <p className="text-xs text-slate-500 mb-6">
          Your mobile number will only be used to send emergency
          landslide warning alerts.
        </p>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          Save Profile
        </button>

        {saved && (
          <p className="text-green-600 text-sm mt-4 text-center">
            Profile saved successfully.
          </p>
        )}
      </div>
    </main>
  );
}
