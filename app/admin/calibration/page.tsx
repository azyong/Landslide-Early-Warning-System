"use client";

import { rtdb } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import { useState } from "react";

export default function Calibrate() {
  const [dry, setDry] = useState(3300);
  const [wet, setWet] = useState(1400);

  const save = () => {
    update(ref(rtdb, "calibration"), { dry, wet });
    alert("Saved!");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Calibration</h1>

      <input
        className="border p-2 mr-2"
        value={dry}
        onChange={e => setDry(+e.target.value)}
      />

      <input
        className="border p-2"
        value={wet}
        onChange={e => setWet(+e.target.value)}
      />

      <button onClick={save} className="ml-3 bg-blue-600 text-white p-2">
        Save
      </button>
    </div>
  );
}
