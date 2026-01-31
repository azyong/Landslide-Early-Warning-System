import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

const SEMAPHORE_KEY = process.env.SEMAPHORE_KEY!;

// ===== FIREBASE INIT =====
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ===== GET ALL PHONE NUMBERS =====
async function getAllPhones() {
  const snap = await getDocs(collection(db, "users"));
  const phones: string[] = [];

  snap.forEach((doc) => {
    const data = doc.data();
    if (data.phone) phones.push(data.phone);
  });

  return phones;
}

export async function POST(req: Request) {
  try {
    const { SensorName, moisture, status } = await req.json();

    if (status !== "Danger") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const message = `🚨 LANDSLIDE ALERT!
location: ${SensorName}
Soil moisture reached ${moisture}%.
Status: DANGER
Please take precautions immediately.`;

    // ===== GET USERS =====
    const phones = await getAllPhones();

    // ===== EMAIL =====
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"Landslide System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "🚨 LANDSLIDE DANGER ALERT",
      text: message,
    });

    // ===== SMS =====
    for (const phone of phones) {
      await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: SEMAPHORE_KEY,
          number: phone,
          message,
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      sentTo: phones.length,
    });
  } catch (err: any) {
    console.error("ALERT ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
