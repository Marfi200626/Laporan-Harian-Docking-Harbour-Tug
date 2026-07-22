"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar({ title }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="bg-navy-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-300 uppercase tracking-wide">
            FM.TB.414
          </p>
          <h1 className="text-lg font-bold leading-tight">
            {title || "Laporan Harian Docking"}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
