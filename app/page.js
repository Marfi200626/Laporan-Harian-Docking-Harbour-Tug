"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

function DashboardContent() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("id, nama_kapal, jenis_survei, hari_tanggal, status, pekerjaan_dock, updated_at")
      .order("updated_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  }

  async function handleCreate() {
    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("reports")
      .insert({ nama_kapal: "Laporan Baru", created_by: user?.id })
      .select("id")
      .single();

    setCreating(false);
    if (!error && data) {
      router.push(`/laporan/${data.id}`);
    }
  }

  async function handleDelete(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Hapus laporan ini secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    const { data, error } = await supabase.from("reports").delete().eq("id", id).select("id");
    if (error) {
      alert(
        "Gagal menghapus: " +
          error.message +
          "\n\nKemungkinan migrasi database belum dijalankan ulang di Supabase (SQL Editor > jalankan schema.sql terbaru)."
      );
      return;
    }
    if (!data || data.length === 0) {
      alert(
        "Laporan TIDAK berhasil dihapus dari database (izin ditolak diam-diam oleh Supabase).\n\nIni terjadi karena migrasi SQL terbaru belum dijalankan. Buka Supabase > SQL Editor > jalankan ulang seluruh isi file schema.sql, lalu coba hapus lagi."
      );
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Daftar Laporan</h2>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? "Membuat..." : "+ Laporan Baru"}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat data...</p>
        ) : reports.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">
            Belum ada laporan. Klik "Laporan Baru" untuk mulai mengisi.
          </div>
        ) : (
          <div className="grid gap-3">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/laporan/${r.id}`}
                className="card flex items-center justify-between hover:border-navy-700 transition"
              >
                <div>
                  <p className="font-semibold text-navy-900">
                    {r.nama_kapal || "(Belum diisi)"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.jenis_survei || "-"} &middot;{" "}
                    {r.hari_tanggal || "Tanggal belum diisi"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-navy-700">
                    {r.pekerjaan_dock?.progress_percent ?? 0}%
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      r.status === "signed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status === "signed" ? "Ditandatangani" : "Draft"}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, r.id)}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Hapus
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
