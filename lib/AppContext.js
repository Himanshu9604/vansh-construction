"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db, firebaseReady } from "./firebase";
import { ROLE_DEFAULT_RATE } from "./calc";

const AppCtx = createContext(null);
const COLLECTIONS = ["sites", "labourers", "attendance", "slabEntries", "materials", "payments", "advances", "estimates", "settings"];

export function AppProvider({ children }) {
  const [data, setData] = useState(() => Object.fromEntries(COLLECTIONS.map(c => [c, []])));
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState([]);
  const seeded = useRef(false);

  const toast = useCallback((msg, type = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    if (!firebaseReady || !db) return;
    const unsubs = COLLECTIONS.map(col =>
      onSnapshot(
        collection(db, col),
        snap => {
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => ({ ...prev, [col]: rows }));
          setReady(true);
        },
        err => toast(`Sync error (${col}): ${err.message}`, "err")
      )
    );
    return () => unsubs.forEach(u => u());
  }, [toast]);

  // Seed 35 default Mistri the first time the labourers list is empty
  useEffect(() => {
    if (!ready || seeded.current) return;
    if (data.labourers.length > 0) { seeded.current = true; return; }
    seeded.current = true;
    (async () => {
      for (let i = 1; i <= 35; i++) {
        await addDoc(collection(db, "labourers"), {
          name: `Mistri ${i}`, gaon: "", role: "mistri", rate: ROLE_DEFAULT_RATE.mistri, active: true,
        });
      }
      toast("35 default Mistri added — edit each with the real names", "ok");
    })();
  }, [ready, data.labourers.length, toast]);

  const add = useCallback(async (col, payload) => {
    if (!db) { toast("Firebase not configured — check .env.local", "err"); return; }
    try { await addDoc(collection(db, col), payload); }
    catch (e) { toast("Save failed: " + e.message, "err"); }
  }, [toast]);

  const update = useCallback(async (col, id, payload) => {
    if (!db) { toast("Firebase not configured — check .env.local", "err"); return; }
    try { await updateDoc(doc(db, col, id), payload); }
    catch (e) { toast("Update failed: " + e.message, "err"); }
  }, [toast]);

  const remove = useCallback(async (col, id) => {
    if (!db) { toast("Firebase not configured — check .env.local", "err"); return; }
    try { await deleteDoc(doc(db, col, id)); }
    catch (e) { toast("Delete failed: " + e.message, "err"); }
  }, [toast]);

  const setDocById = useCallback(async (col, id, payload) => {
    if (!db) { toast("Firebase not configured — check .env.local", "err"); return; }
    try { await setDoc(doc(db, col, id), payload, { merge: true }); }
    catch (e) { toast("Save failed: " + e.message, "err"); }
  }, [toast]);

  return (
    <AppCtx.Provider value={{ data, ready, firebaseReady, toast, toasts, add, update, remove, setDocById }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
