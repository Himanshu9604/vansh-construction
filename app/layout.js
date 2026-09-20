"use client";
import { useEffect, useState } from "react";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { firebaseReady } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToastWrap from "@/components/Toast";

export default function RootLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("vc-theme");
    if (saved === "dark") setDark(true);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("vc-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <html lang="en" data-theme={dark ? "dark" : "light"}>
      <head><title>Vansh Construction — Labour & Site Management</title></head>
      <body>
        <AppProvider>
          <div className="app-shell">
            <Sidebar open={open} onClose={() => setOpen(false)} />
            {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
            <div className="main-wrap">
              <Header onMenuClick={() => setOpen(o => !o)} dark={dark} onToggleDark={() => setDark(d => !d)} />
              {!firebaseReady && (
                <div className="banner-warn">
                  ⚠️ Firebase is not configured — copy .env.local.example to .env.local, fill in your Firebase
                  project keys, then restart the dev server (or redeploy on Vercel). Nothing will save until then.
                </div>
              )}
              <main className="page">{children}</main>
              <Footer />
            </div>
          </div>
          <ToastWrap />
        </AppProvider>
      </body>
    </html>
  );
}
