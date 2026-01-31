"use client";

import { useEffect, useRef } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function AlertListener() {
  // prevents spamming alerts
  const hasAlerted = useRef(false);

  useEffect(() => {
    const sensorsRef = ref(rtdb, "sensors/latest");

    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      let dangerSensor: any = null;

      // Check sensor 1
      if (data.sensor1?.status === "Danger") {
        dangerSensor = data.sensor1;
      }
      // Check sensor 2
      else if (data.sensor2?.status === "Danger") {
        dangerSensor = data.sensor2;
      }

      // 🚨 Trigger alert ONCE
      if (dangerSensor && !hasAlerted.current) {
        hasAlerted.current = true;

        fetch("/api/alert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sensorName: dangerSensor.name || "Unknown Location",
            moisture: dangerSensor.moisture,
          }),
        });
      }

      // ✅ Reset alert when system is safe again
      if (
        data.sensor1?.status !== "Danger" &&
        data.sensor2?.status !== "Danger"
      ) {
        hasAlerted.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
