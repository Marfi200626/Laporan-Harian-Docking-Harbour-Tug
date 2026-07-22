"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "dokumentasi-docking";

export default function PhotoUploader({ reportId, photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [newSection, setNewSection] = useState("Umum");

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
          section: newSection || "Umum",
          url: publicUrlData.publicUrl,
          caption: "",
          order_index: photos.length,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        onChange([...photos, inserted]);
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

  async function updateSection(photoId, section) {
    onChange(
      photos.map((p) => (p.id === photoId ? { ...p, section } : p))
    );
    await supabase.from("report_photos").update({ section }).eq("id", photoId);
  }

  async function deletePhoto(photoId) {
    if (!confirm("Hapus foto ini?")) return;
    await supabase.from("report_photos").delete().eq("id", photoId);
    onChange(photos.filter((p) => p.id !== photoId));
  }

  const grouped = photos.reduce((acc, p) => {
    const key = p.section || "Umum";
    acc[key] = acc[key] || [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-48">
          <label>Kategori foto berikutnya</label>
          <input
            type="text"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Deck / Engine / Umum"
          />
        </div>
        <div>
          <label>Upload Foto</label>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFiles}
            disabled={uploading}
            className="text-xs"
          />
        </div>
        {uploading && (
          <span className="text-xs text-navy-700">Mengunggah...</span>
        )}
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-xs text-slate-400">Belum ada foto diunggah.</p>
      )}

      {Object.entries(grouped).map(([section, list]) => (
        <div key={section} className="mb-5">
          <p className="text-xs font-bold text-navy-800 mb-2">{section}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {list.map((p) => (
              <div
                key={p.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
              >
                <img
                  src={p.url}
                  alt={p.caption || "dokumentasi"}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 space-y-1">
                  <input
                    type="text"
                    value={p.section}
                    onChange={(e) => updateSection(p.id, e.target.value)}
                    className="!text-xs !py-1"
                    placeholder="Kategori"
                  />
                  <input
                    type="text"
                    value={p.caption}
                    onChange={(e) => updateCaption(p.id, e.target.value)}
                    className="!text-xs !py-1"
                    placeholder="Penjelasan foto"
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
      ))}
    </div>
  );
}
