"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ADMIN_EMAIL = "cymondleigh@gmail.com";

export default function PostLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) return;

    if (email === ADMIN_EMAIL) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Redirecting...
    </div>
  );
}
