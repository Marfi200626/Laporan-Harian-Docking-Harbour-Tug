"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import PhotoUploader from "@/components/PhotoUploader";
import SignatureBlock from "@/components/SignatureBlock";
import { supabase } from "@/lib/supabaseClient";
import { exportReportToDocx, exportReportToPdf } from "@/lib/generateDocx";
import { NAMA_BY_JABATAN, JENIS_SURVEI_OPTIONS, LOKASI_DOCK_OPTIONS, NAMA_KAPAL_OPTIONS } from "@/lib/refData";

function FormContent() {
  const { id } = useParams();
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    setLoading(true);
    const { data: reportData } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();
    const { data: photoData } = await supabase
      .from("report_photos")
      .select("*")
      .eq("report_id", id)
      .order("order_index");

    setReport(reportData);
    setPhotos(photoData || []);
    setLoading(false);
  }

  const isSigned = report?.status === "signed";

  function updateField(field, value) {
    setReport((r) => ({ ...r, [field]: value }));
  }

  function updateJadwal(index, field, value) {
    const updated = [...report.jadwal_kegiatan];
    updated[index] = { ...updated[index], [field]: value };
    updateField("jadwal_kegiatan", updated);
  }

  function updateKendala(index, value) {
    const updated = [...report.kendala];
    updated[index] = { ...updated[index], deskripsi: value };
    updateField("kendala", updated);
  }
  function addKendala() {
    const updated = [...(report.kendala || [])];
    updated.push({ no: updated.length + 1, deskripsi: "" });
    updateField("kendala", updated);
  }
  function removeKendala(index) {
    const updated = report.kendala.filter((_, i) => i !== index).map((k, i) => ({ ...k, no: i + 1 }));
    updateField("kendala", updated);
  }

  function updatePekerjaan(path, value) {
    const updated = JSON.parse(JSON.stringify(report.pekerjaan_dock || {}));
    let obj = updated;
    for (let i = 0; i < path.length - 1; i++) {
      obj[path[i]] = obj[path[i]] || {};
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;
    updateField("pekerjaan_dock", updated);
  }

  function addPO() {
    const updated = { ...report.pekerjaan_dock, outstanding_po: [...(report.pekerjaan_dock.outstanding_po || []), { no_po: "", items: [{ nama_barang: "", outstanding: "" }] }] };
    updateField("pekerjaan_dock", updated);
  }
  function updatePOField(index, field, value) {
    const po = [...report.pekerjaan_dock.outstanding_po];
    po[index] = { ...po[index], [field]: value };
    updateField("pekerjaan_dock", { ...report.pekerjaan_dock, outstanding_po: po });
  }
  function removePO(index) {
    const po = report.pekerjaan_dock.outstanding_po.filter((_, i) => i !== index);
    updateField("pekerjaan_dock", { ...report.pekerjaan_dock, outstanding_po: po });
  }
  function addPOItem(poIndex) {
    const po = [...report.pekerjaan_dock.outstanding_po];
    const items = [...(po[poIndex].items || []), { nama_barang: "", outstanding: "" }];
    po[poIndex] = { ...po[poIndex], items };
    updateField("pekerjaan_dock", { ...report.pekerjaan_dock, outstanding_po: po });
  }
  function updatePOItem(poIndex, itemIndex, field, value) {
    const po = [...report.pekerjaan_dock.outstanding_po];
    const items = [...(po[poIndex].items || [])];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    po[poIndex] = { ...po[poIndex], items };
    updateField("pekerjaan_dock", { ...report.pekerjaan_dock, outstanding_po: po });
  }
  function removePOItem(poIndex, itemIndex) {
    const po = [...report.pekerjaan_dock.outstanding_po];
    const items = (po[poIndex].items || []).filter((_, i) => i !== itemIndex);
    po[poIndex] = { ...po[poIndex], items };
    updateField("pekerjaan_dock", { ...report.pekerjaan_dock, outstanding_po: po });
  }

  function updateNote(index, value) {
    const updated = [...report.additional_notes];
    updated[index] = { ...updated[index], catatan: value };
    updateField("additional_notes", updated);
  }
  function addNote() {
    const updated = [...(report.additional_notes || [])];
    updated.push({ no: updated.length + 1, catatan: "" });
    updateField("additional_notes", updated);
  }
  function removeNote(index) {
    const updated = report.additional_notes.filter((_, i) => i !== index).map((n, i) => ({ ...n, no: i + 1 }));
    updateField("additional_notes", updated);
  }

  const handleSave = useCallback(async () => {
    if (!report) return;
    setSaving(true);
    const { id: _id, created_at, updated_at, ...payload } = report;
    const { error } = await supabase.from("reports").update(payload).eq("id", id);
    setSaving(false);
    if (!error) setSavedAt(new Date());
  }, [report, id]);

  async function handleSignOS({ nama, timestamp, barcode }) {
    const payload = {
      dibuat_oleh_nama: nama,
      ditandatangani_os_at: timestamp,
      dibuat_oleh_barcode: barcode,
    };
    setReport((r) => ({ ...r, ...payload }));
    await supabase.from("reports").update(payload).eq("id", id);
  }

  async function handleSignOM({ nama, timestamp, barcode }) {
    const payload = {
      diketahui_oleh_nama: nama,
      ditandatangani_om_at: timestamp,
      diketahui_oleh_barcode: barcode,
      status: "signed",
    };
    setReport((r) => ({ ...r, ...payload }));
    await supabase.from("reports").update(payload).eq("id", id);
  }

  async function handleUnlock() {
    if (!confirm("Buka kembali laporan ini untuk diedit? Status akan kembali menjadi draft.")) return;
    const payload = { status: "draft" };
    setReport((r) => ({ ...r, ...payload }));
    await supabase.from("reports").update(payload).eq("id", id);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportReportToDocx(report, photos);
    } catch (e) {
      alert("Gagal membuat file Word: " + e.message);
    }
    setExporting(false);
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await exportReportToPdf(report, photos);
    } catch (e) {
      alert("Gagal membuat file PDF: " + e.message);
    }
    setExportingPdf(false);
  }

  async function handleDelete() {
    if (!confirm("Hapus laporan ini secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    await supabase.from("reports").delete().eq("id", id);
    router.push("/");
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-sm text-slate-500 mt-10">Memuat laporan...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-sm text-slate-500 mt-10">Laporan tidak ditemukan.</p>
      </div>
    );
  }

  const progress = report.pekerjaan_dock?.progress_percent ?? 0;

  return (
    <div>
      <Navbar title={report.nama_kapal || "Laporan Baru"} />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 pb-28">
        <button onClick={() => router.push("/")} className="text-xs text-navy-700 hover:underline">
          &larr; Kembali ke Daftar Laporan
        </button>

        {isSigned && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg px-4 py-3 flex items-center justify-between">
            <span>Laporan ini sudah ditandatangani dan terkunci dari perubahan.</span>
            <button onClick={handleUnlock} className="underline font-medium">
              Buka untuk edit
            </button>
          </div>
        )}

        <fieldset disabled={isSigned} className="space-y-5">
          {/* HEADER */}
          <div className="card">
            <p className="section-title">Data Umum</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Jabatan</label>
                <select
                  value={report.jabatan || "Owner Superintendent (OS)"}
                  onChange={(e) => {
                    updateField("jabatan", e.target.value);
                    updateField("nama_os", ""); // reset nama karena daftar pilihan berubah
                  }}
                >
                  <option value="Owner Superintendent (OS)">Owner Superintendent (OS)</option>
                  <option value="Docking Superintendent (DS)">Docking Superintendent (DS)</option>
                  <option value="Technical Superintendent (TS)">Technical Superintendent (TS)</option>
                </select>
              </div>
              <div>
                <label>Nama Kapal</label>
                <select value={report.nama_kapal || ""} onChange={(e) => updateField("nama_kapal", e.target.value)}>
                  <option value="">-- Pilih Kapal --</option>
                  {NAMA_KAPAL_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Nama OS/DS/TS</label>
                <select value={report.nama_os || ""} onChange={(e) => updateField("nama_os", e.target.value)}>
                  <option value="">-- Pilih Nama --</option>
                  {(NAMA_BY_JABATAN[report.jabatan] || NAMA_BY_JABATAN["Owner Superintendent (OS)"]).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Jenis Survei</label>
                <select value={report.jenis_survei || ""} onChange={(e) => updateField("jenis_survei", e.target.value)}>
                  <option value="">-- Pilih Jenis Survei --</option>
                  {JENIS_SURVEI_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Divisi/Dept.</label>
                <input value={report.divisi || ""} onChange={(e) => updateField("divisi", e.target.value)} />
              </div>
              <div>
                <label>Hari, tanggal</label>
                <input type="date" value={report.hari_tanggal || ""} onChange={(e) => updateField("hari_tanggal", e.target.value)} />
              </div>
              <div>
                <label>Docking Terakhir</label>
                <input value={report.docking_terakhir || ""} onChange={(e) => updateField("docking_terakhir", e.target.value)} />
              </div>
              <div>
                <label>Lokasi Docking</label>
                <select value={report.lokasi_docking || ""} onChange={(e) => updateField("lokasi_docking", e.target.value)}>
                  <option value="">-- Pilih Lokasi --</option>
                  {LOKASI_DOCK_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* JADWAL KEGIATAN */}
          <div className="card overflow-x-auto">
            <p className="section-title">A. Jadwal Deskripsi Kegiatan</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="w-8 py-1">No</th>
                  <th className="py-1">Kegiatan</th>
                  <th className="py-1">Target</th>
                  <th className="py-1">Aktual</th>
                </tr>
              </thead>
              <tbody>
                {report.jadwal_kegiatan.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2 text-slate-400">{item.no}</td>
                    <td className="py-2 pr-2 font-medium">{item.kegiatan}</td>
                    <td className="py-2 pr-2">
                      <input type="datetime-local" value={item.target || ""} onChange={(e) => updateJadwal(i, "target", e.target.value)} />
                    </td>
                    <td className="py-2">
                      <input type="datetime-local" value={item.aktual || ""} onChange={(e) => updateJadwal(i, "aktual", e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KENDALA */}
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0 border-0 pb-0">B. Kendala Jadwal Kegiatan</p>
              <button type="button" onClick={addKendala} className="btn-secondary text-xs">+ Tambah</button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Contoh: cuaca, dock, manpower</p>
            <div className="space-y-2">
              {(report.kendala || []).map((k, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-5">{k.no}.</span>
                  <input value={k.deskripsi || ""} onChange={(e) => updateKendala(i, e.target.value)} />
                  <button type="button" onClick={() => removeKendala(i)} className="btn-danger">Hapus</button>
                </div>
              ))}
              {(!report.kendala || report.kendala.length === 0) && (
                <p className="text-xs text-slate-400">Belum ada kendala dicatat.</p>
              )}
            </div>
          </div>

          {/* PEKERJAAN DOCK */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0 border-0 pb-0">C. Pekerjaan Dock</p>
              <div className="flex items-center gap-2">
                <label className="!mb-0">Progress</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => updatePekerjaan(["progress_percent"], Number(e.target.value))}
                  className="!w-20"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-navy-800 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-navy-800 mb-2">1. Deck</p>
                <label>Crew</label>
                <textarea rows={2} value={report.pekerjaan_dock?.deck?.crew || ""} onChange={(e) => updatePekerjaan(["deck", "crew"], e.target.value)} />
                <label className="mt-2">Shipyard</label>
                <textarea rows={2} value={report.pekerjaan_dock?.deck?.shipyard || ""} onChange={(e) => updatePekerjaan(["deck", "shipyard"], e.target.value)} />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-800 mb-2">2. Engine</p>
                <label>Crew</label>
                <textarea rows={2} value={report.pekerjaan_dock?.engine?.crew || ""} onChange={(e) => updatePekerjaan(["engine", "crew"], e.target.value)} />
                <label className="mt-2">Shipyard</label>
                <textarea rows={2} value={report.pekerjaan_dock?.engine?.shipyard || ""} onChange={(e) => updatePekerjaan(["engine", "shipyard"], e.target.value)} />
                <label className="mt-2">Workshop</label>
                <textarea rows={2} value={report.pekerjaan_dock?.engine?.workshop || ""} onChange={(e) => updatePekerjaan(["engine", "workshop"], e.target.value)} />
              </div>
            </div>

            <div>
              <label>3. Outstanding Pekerjaan</label>
              <textarea rows={2} value={report.pekerjaan_dock?.outstanding_pekerjaan || ""} onChange={(e) => updatePekerjaan(["outstanding_pekerjaan"], e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="!mb-0">4. Outstanding Permintaan Barang</label>
                <button type="button" onClick={addPO} className="btn-secondary text-xs">+ Tambah No. PO</button>
              </div>
              <div className="space-y-3 mt-2">
                {(report.pekerjaan_dock?.outstanding_po || []).map((po, i) => (
                  <div key={i} className="border border-slate-200 rounded-md p-3 space-y-2">
                    <div>
                      <label>No. PO</label>
                      <input value={po?.no_po || ""} onChange={(e) => updatePOField(i, "no_po", e.target.value)} placeholder="cth: LRD126061309" />
                    </div>

                    <div className="space-y-2">
                      {(po.items || []).map((item, j) => (
                        <div key={j} className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded">
                          <div>
                            <label>Nama Barang {j + 1}</label>
                            <input value={item?.nama_barang || ""} onChange={(e) => updatePOItem(i, j, "nama_barang", e.target.value)} placeholder="cth: Cooling Fan Alternator" />
                          </div>
                          <div>
                            <label>Outstanding / Status</label>
                            <div className="flex gap-2">
                              <input value={item?.outstanding || ""} onChange={(e) => updatePOItem(i, j, "outstanding", e.target.value)} placeholder="cth: Estimasi tiba 21 Juli" />
                              <button type="button" onClick={() => removePOItem(i, j)} className="btn-danger shrink-0">Hapus</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addPOItem(i)} className="btn-secondary text-xs">+ Tambah Barang Lain di PO Ini</button>
                    </div>

                    <button type="button" onClick={() => removePO(i)} className="btn-danger block">Hapus No. PO Ini</button>
                  </div>
                ))}
                {(!report.pekerjaan_dock?.outstanding_po || report.pekerjaan_dock.outstanding_po.length === 0) && (
                  <p className="text-xs text-slate-400">Belum ada barang outstanding dicatat.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-navy-800 mb-2">5. Sumber Daya</p>

              <p className="text-xs font-semibold text-slate-600 mb-1">Crew</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label>Deck (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.crew?.deck ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "crew", "deck"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Engine (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.crew?.engine ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "crew", "engine"], Number(e.target.value))} />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-600 mb-1">Shipyard</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label>Welder (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.shipyard?.welder ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "shipyard", "welder"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Piping (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.shipyard?.piping ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "shipyard", "piping"], Number(e.target.value))} />
                </div>
                <div>
                  <label>HSE (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.shipyard?.hse ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "shipyard", "hse"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Docking Undocking (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.shipyard?.docking_undocking ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "shipyard", "docking_undocking"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Team Propulsi (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.shipyard?.propulsi ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "shipyard", "propulsi"], Number(e.target.value))} />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-600 mb-1">Teknisi</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label>Teknisi ME (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.teknisi?.me ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "teknisi", "me"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Teknisi AE (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.teknisi?.ae ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "teknisi", "ae"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Teknisi Electrician (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.teknisi?.electrician ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "teknisi", "electrician"], Number(e.target.value))} />
                </div>
                <div>
                  <label>Team Propulsi (orang)</label>
                  <input type="number" min={0} value={report.pekerjaan_dock?.sumber_daya?.teknisi?.propulsi ?? 0} onChange={(e) => updatePekerjaan(["sumber_daya", "teknisi", "propulsi"], Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* FOTO DOKUMENTASI */}
          <div className="card">
            <p className="section-title">D. Foto Dokumentasi</p>
            <PhotoUploader reportId={id} photos={photos} onChange={setPhotos} />
          </div>

          {/* ADDITIONAL NOTES */}
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0 border-0 pb-0">E. Additional Notes</p>
              <button type="button" onClick={addNote} className="btn-secondary text-xs">+ Tambah</button>
            </div>
            <div className="space-y-2 mt-3">
              {(report.additional_notes || []).map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-5">{n.no}.</span>
                  <input value={n.catatan || ""} onChange={(e) => updateNote(i, e.target.value)} />
                  <button type="button" onClick={() => removeNote(i)} className="btn-danger">Hapus</button>
                </div>
              ))}
              {(!report.additional_notes || report.additional_notes.length === 0) && (
                <p className="text-xs text-slate-400">Belum ada catatan tambahan.</p>
              )}
            </div>
          </div>
        </fieldset>

        {/* TANDA TANGAN */}
        <div className="card">
          <p className="section-title">Tanda Tangan Persetujuan</p>
          <div className="grid grid-cols-2 gap-6">
            <SignatureBlock
              title={`Dibuat Oleh (${report.jabatan || "Owner Superintendent"})`}
              roleCode="OS"
              nama={report.dibuat_oleh_nama}
              jabatanValue={report.jabatan || "Owner Superintendent (OS)"}
              barcode={report.dibuat_oleh_barcode}
              signedAt={report.ditandatangani_os_at}
              reportId={id}
              disabled={isSigned}
              onSign={handleSignOS}
            />
            <SignatureBlock
              title="Diketahui Oleh (Operation Manager)"
              roleCode="OM"
              nama={report.diketahui_oleh_nama}
              jabatanValue="Operation Manager"
              barcode={report.diketahui_oleh_barcode}
              signedAt={report.ditandatangani_om_at}
              reportId={id}
              disabled={isSigned || !report.dibuat_oleh_nama}
              onSign={handleSignOM}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={handleDelete} className="btn-danger">
            Hapus Laporan
          </button>
        </div>
      </div>

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {saving ? "Menyimpan..." : savedAt ? `Tersimpan ${savedAt.toLocaleTimeString("id-ID")}` : "Belum disimpan"}
          </span>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || isSigned} className="btn-secondary">
              Simpan
            </button>
            <button onClick={handleExportPdf} disabled={exportingPdf} className="btn-secondary">
              {exportingPdf ? "Membuat PDF..." : "Export ke PDF"}
            </button>
            <button onClick={handleExport} disabled={exporting} className="btn-primary">
              {exporting ? "Membuat file..." : "Export ke Word (.docx)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <AuthGuard>
      <FormContent />
    </AuthGuard>
  );
}
