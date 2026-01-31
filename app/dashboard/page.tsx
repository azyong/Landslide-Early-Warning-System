"use client";

import { auth, rtdb, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue, off } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // realtime data
  const [latest, setLatest] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // phone check
  const [hasPhone, setHasPhone] = useState(true);

  // ============== AUTH ==============
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // check phone number
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (!snap.exists() || !snap.data().phone) {
        setHasPhone(false);
      } else {
        setHasPhone(true);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // ============== REALTIME LISTEN ==============
  useEffect(() => {
    if (!user) return;

    const latestRef = ref(rtdb, "sensors/latest");
    const settingsRef = ref(rtdb, "settings");

    onValue(latestRef, (snap) => {
      setLatest(snap.val());
    });

    onValue(settingsRef, (snap) => {
      setSettings(snap.val());
    });

    return () => {
      off(latestRef);
      off(settingsRef);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  if (!user) return null;

  // ============== SMART SENSOR SELECTION ==============
  const s1 = latest?.sensor1?.moisture ?? 0;
  const s2 = latest?.sensor2?.moisture ?? 0;

  const activeSensor =
    s1 >= s2
      ? {
          id: "sensor1",
          moisture: s1,
          timestamp: latest?.sensor1?.timestamp,
          name: latest?.sensor1?.name || "Sensor 1",
        }
      : {
          id: "sensor2",
          moisture: s2,
          timestamp: latest?.sensor2?.timestamp,
          name: latest?.sensor2?.name || "Sensor 2",
        };

  const moisture = activeSensor.moisture;

  const safe = settings?.safe ?? 60;
  const warning = settings?.warning ?? 75;

  const systemStatus =
    moisture < safe
      ? "Safe"
      : moisture < warning
      ? "Warning"
      : "Danger";

  const statusColor =
    systemStatus === "Safe"
      ? "bg-green-500"
      : systemStatus === "Warning"
      ? "bg-yellow-500"
      : "bg-red-500";

  const lastUpdated = activeSensor.timestamp
    ? new Date(activeSensor.timestamp * 1000).toLocaleString()
    : "No data";

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">User Dashboard</h1>
          <p className="text-slate-600 text-sm">
            Welcome, {user.displayName || user.email}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
  {!hasPhone && (
    <div className="bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-full border border-blue-300 animate-pulse whitespace-nowrap">
      📱 Set your phone number for emergency alerts
    </div>
  )}

  <Link
    href="/profile"
    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
  >
    Profile
  </Link>

  <button
    onClick={async () => {
      await signOut(auth);
      router.push("/");
    }}
    className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition"
  >
    Sign Out
  </button>
</div>

      </header>

      {/* STATUS CARDS */}
      <section className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-sm font-medium text-slate-500 mb-2">
            System Status
          </h3>

          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
            <p className="text-xl font-semibold">{systemStatus}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-sm font-medium text-slate-500 mb-2">
            Highest Risk Area
          </h3>

          <p className="text-lg font-semibold">{activeSensor.name}</p>
          <p className="text-2xl font-bold">{moisture}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-sm font-medium text-slate-500 mb-2">
            Last Updated
          </h3>

          <p className="text-sm">{lastUpdated}</p>
        </div>
      </section>

      {/* INFO */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-3">
          About This System
        </h2>

        <p className="text-slate-600 text-sm leading-relaxed">
          This dashboard displays monitoring data collected from ESP32-based soil
          moisture sensors. When moisture levels exceed defined thresholds,
          early warning alerts are triggered to help residents take
          precautionary action.
        </p>
      </section>
    </main>
  );
}
