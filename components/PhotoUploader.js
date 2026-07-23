"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "dokumentasi-docking";

export default function PhotoUploader({ reportId, photos, onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let runningCount = photos.length;

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${reportId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) {
        alert("Gagal upload foto: " + uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const { data: inserted, error: insertError } = await supabase
        .from("report_photos")
        .insert({
          report_id: reportId,
          section: "Umum",
          url: publicUrlData.publicUrl,
          caption: "",
          order_index: runningCount,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        runningCount += 1;
        onChange((prev) => [...prev, inserted]);
      }
    }

    setUploading(false);
    e.target.value = "";
  }

  async function updateCaption(photoId, caption) {
    onChange(
      photos.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
    await supabase.from("report_photos").update({ caption }).eq("id", photoId);
  }

  async function deletePhoto(photoId) {
    if (!confirm("Hapus foto ini?")) return;
    await supabase.from("report_photos").delete().eq("id", photoId);
    onChange(photos.filter((p) => p.id !== photoId));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <label>Tambah Foto (bisa pilih banyak sekaligus, tidak ada batas jumlah)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            disabled={uploading}
            className="text-xs"
          />
        </div>
        {uploading && (
          <span className="text-xs text-navy-700">Mengunggah...</span>
        )}
      </div>

      {photos.length === 0 && (
        <p className="text-xs text-slate-400">
          Belum ada foto diunggah. Klik tombol di atas untuk mulai menambahkan.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
          >
            <div className="relative bg-slate-200 flex items-center justify-center h-40">
              <img
                src={p.url}
                alt={p.caption || `Foto ${i + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              <span className="absolute top-1 left-1 bg-navy-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Foto {i + 1}
              </span>
            </div>
            <div className="p-2 space-y-1">
              <label className="!mb-0.5">Keterangan Foto {i + 1}</label>
              <input
                type="text"
                value={p.caption}
                onChange={(e) => updateCaption(p.id, e.target.value)}
                className="!text-xs !py-1"
                placeholder="cth: Kondisi lambung kapal sebelum sandblasting"
              />
              <button
                onClick={() => deletePhoto(p.id)}
                className="btn-danger"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
