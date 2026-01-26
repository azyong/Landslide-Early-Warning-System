"use client";
import { useEffect } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export default function AlertListener(){

  useEffect(()=>{
    onValue(ref(rtdb,"sensors/latest"), snap=>{
      const d = snap.val();

      if(d.sensor1.status==="Danger" ||
         d.sensor2.status==="Danger") {

        fetch("/api/alert",{
          method:"POST",
          body:JSON.stringify({
            message:`DANGER! S1:${d.sensor1.moisture}% S2:${d.sensor2.moisture}%`
          })
        });
      }
    });
  },[]);

  return null;
}
