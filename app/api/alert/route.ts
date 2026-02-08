import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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
    console.log("🚨 ALERT API CALLED");

    const body = await req.json();

    const message = `
🚨 LANDSLIDE DANGER ALERT

Location: ${body.sensorName}
Moisture Level: ${body.moisture}%

Please take precaution immediately.
`;

    const emails = await getAllEmails();
    console.log("📧 Emails:", emails);

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

    await transporter.sendMail({
      from: `"Landslide Alert System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      bcc: emails,
      subject: "🚨 LANDSLIDE DANGER ALERT",
      text: message,
    });

    return NextResponse.json({ ok: true, sentTo: emails.length });
  } catch (err: any) {
    console.error("EMAIL ALERT ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
