"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db, rtdb } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue, update, off } from "firebase/database";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import Papa from "papaparse";
import useSound from "use-sound";

export default function AdminDashboardPage() {
  const router = useRouter();

  // ================= STATE =================
  const [authChecked, setAuthChecked] = useState(false);

  const [latest, setLatest] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [danger, setDanger] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // optional siren (put siren.mp3 in /public)
  const [play] = useSound("/siren.mp3");

  // ================= AUTH GUARD =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || snap.data().role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAuthChecked(true);
    });

    return () => unsub();
  }, [router]);

  // ================= LATEST + SETTINGS =================
  useEffect(() => {
    if (!authChecked) return;

    const latestRef = ref(rtdb, "sensors/latest");
    const settingsRef = ref(rtdb, "settings");

    const unsubLatest = onValue(latestRef, (snap) => {
      const data = snap.val() || {};
      setLatest(data);

      const now = Date.now();
      setLastUpdate(now);

      // offline if no update for 60 sec
      if (data.sensor1?.timestamp) {
        const age = now - data.sensor1.timestamp * 1000;
        setOffline(age > 60000);
      }

      // 🚨 danger detection
      if (
        data.sensor1?.status === "Danger" ||
        data.sensor2?.status === "Danger"
      ) {
        setDanger(true);
        play();
      } else {
        setDanger(false);
      }
    });

    const unsubSettings = onValue(settingsRef, (snap) => {
      setSettings(snap.val() || {});
    });

    return () => {
      off(latestRef);
      off(settingsRef);
    };
  }, [authChecked, play]);

  // ================= HISTORY =================
  useEffect(() => {
    const historyRef = ref(rtdb, "sensors/history");

    const unsub = onValue(historyRef, (snap) => {
      const val = snap.val();
      if (!val) return;

      const formatted = Object.entries(val)
        .map(([key, v]: any) => {
          if (!v || typeof v !== "object") return null;
          if (!v.timestamp) return null;

          return {
            time: new Date(v.timestamp * 1000).toLocaleString(), // DATE + TIME
            sensor1: v.sensor1?.moisture ?? 0,
            sensor2: v.sensor2?.moisture ?? 0,
          };

        })
        .filter(Boolean)
        .slice(-20);

      setHistory(formatted as any[]);
    });

    return () => off(historyRef);
  }, []);

  // ================= HELPERS =================
  const renameSensor = (sensor: string, name: string) => {
    update(ref(rtdb, `sensors/latest/${sensor}`), { name });
  };

  const saveThreshold = () => {
    update(ref(rtdb, "settings"), settings);
    alert("Threshold updated");
  };

  const exportCSV = () => {
    const csv = Papa.unparse(history);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sensor_history.csv";
    a.click();
  };

  const statusColor = (status?: string) => {
    if (status === "Safe") return "text-green-600";
    if (status === "Warning") return "text-yellow-600";
    return "text-red-600";
  };

  const Gauge = ({ value, label }: any) => (
    <div className="bg-white p-6 rounded-xl shadow border text-center">
      <h3 className="text-sm text-slate-500 mb-2">{label}</h3>
      <p className="text-4xl font-bold">{value ?? 0}%</p>
    </div>
  );

  // ================= LOADING =================
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking admin access...
      </div>
    );
  }

  // ================= UI =================
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-600 text-sm">Live Sensor Monitoring</p>
        </div>

        <button
          onClick={async () => {
            await signOut(auth);
            router.replace("/login");
          }}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white"
        >
          Sign Out
        </button>
      </header>

      {/* ALERTS */}
      {danger && (
        <div className="bg-red-700 text-white p-4 rounded mb-4 animate-pulse">
          🚨 DANGER LEVEL DETECTED — CHECK AREA IMMEDIATELY
        </div>
      )}

      {offline && (
        <div className="bg-gray-700 text-white p-4 rounded mb-4">
          ⚠ System Offline — No data for 1 minute
        </div>
      )}

      <div className="text-sm text-slate-600 mb-4">
        Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "-"}
      </div>

      {/* GAUGES */}
      <section className="grid md:grid-cols-2 gap-6 mb-8">
        <Gauge
          value={latest?.sensor1?.moisture}
          label={latest?.sensor1?.name || "Sensor 1"}
        />
        <Gauge
          value={latest?.sensor2?.moisture}
          label={latest?.sensor2?.name || "Sensor 2"}
        />
      </section>

      {/* GRAPH */}
      <section className="bg-white p-6 rounded-xl shadow border mb-6">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Moisture History</h2>

          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-3 py-2 rounded"
          >
            Download CSV
          </button>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />

              <Line dataKey="sensor1" stroke="#2563eb" name="Sensor 1" />
              <Line dataKey="sensor2" stroke="#16a34a" name="Sensor 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* THRESHOLD */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-3">Threshold Settings</h2>

        <input
          className="border p-2 mr-2"
          value={settings?.safe ?? ""}
          onChange={(e) =>
            setSettings({ ...settings, safe: +e.target.value })
          }
        />

        <input
          className="border p-2 mr-2"
          value={settings?.warning ?? ""}
          onChange={(e) =>
            setSettings({ ...settings, warning: +e.target.value })
          }
        />

        <button
          onClick={saveThreshold}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Save
        </button>
      </section>
    </main>
  );
}
