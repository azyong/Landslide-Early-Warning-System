import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ===== FIREBASE INIT (SERVER) =====
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ===== GET ALL USER EMAILS =====
async function getAllEmails() {
  const snap = await getDocs(collection(db, "users"));
  const emails: string[] = [];

  snap.forEach((doc) => {
    const data = doc.data();
    if (data.email) emails.push(data.email);
  });

  return emails;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message =
      body.message ||
      `🚨 LANDSLIDE ALERT\nSensor 1: ${body.s1}\nSensor 2: ${body.s2}`;

    const emails = await getAllEmails();

    if (emails.length === 0) {
      return NextResponse.json({ ok: false, error: "No users found" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // SEND TO ALL USERS
    for (const email of emails) {
      await transporter.sendMail({
        from: `"Landslide Alert System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🚨 LANDSLIDE DANGER ALERT",
        text: message,
      });
    }

    return NextResponse.json({
      ok: true,
      sentTo: emails.length,
    });

  } catch (err: any) {
    console.error("EMAIL ALERT ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
