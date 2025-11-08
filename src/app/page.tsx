"use client";

import { useEffect } from "react";
import { db } from "./firebase"; // adjust path if needed
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  useEffect(() => {
    const testConnection = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "test"));
        console.log("✅ Firebase connected! Documents:", querySnapshot.size);
      } catch (err) {
        console.error("❌ Firebase error:", err);
      }
    };

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Firebase Connection Test</h1>
      <p>Open your browser console (F12 → Console tab) to see results.</p>
    </main>
  );
}
