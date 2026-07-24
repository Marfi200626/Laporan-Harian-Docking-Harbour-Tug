"use client";

import { useState } from "react";
import { generateSignatureStamp, buildSignatureCode } from "@/lib/barcode";
import { NAMA_BY_JABATAN } from "@/lib/refData";
import SignaturePad from "./SignaturePad";

export default function SignatureBlock({
  title,
  roleCode, // "OS" | "OM"
  nama,
  jabatanValue,
  barcode,
  signature,
  signedAt,
  reportId,
  disabled,
  onSign,
}) {
  const [draftNama, setDraftNama] = useState(nama || "");
  const [draftSignature, setDraftSignature] = useState(signature || null);

  const isSigned = Boolean(nama && signedAt);
  const namaOptions = NAMA_BY_JABATAN[jabatanValue] || null;

  function handleConfirm() {
    if (!draftNama.trim()) {
      alert("Pilih atau ketik nama lengkap terlebih dahulu sebelum tanda tangan.");
      return;
    }
    const timestamp = new Date().toISOString();
    const code = buildSignatureCode(reportId, roleCode, draftNama.trim(), timestamp);
    const stamp = generateSignatureStamp(code, draftNama.trim(), timestamp);
    onSign({ nama: draftNama.trim(), timestamp, barcode: stamp, signature: draftSignature, code });
  }

  function handleGantiTandaTangan() {
    // Kembalikan ke mode isi ulang, tanpa menghapus data yang tersimpan
    // sampai pengguna menekan Tanda Tangan lagi.
    onSign({ nama: null, timestamp: null, barcode: null, signature: null, code: null, __reset: true });
  }

  return (
    <div className="border border-dashed border-slate-300 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-2">{title}</p>

      {isSigned ? (
        <div className="text-center">
          {signature ? (
            <img src={signature} alt="Tanda tangan" className="mx-auto h-20 object-contain mb-1" />
          ) : (
            <p
              className="text-3xl text-navy-900 mb-1"
              style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
            >
              {nama}
            </p>
          )}
          <p className="text-sm font-semibold text-navy-900">{nama}</p>
          <p className="text-xs font-semibold text-navy-800">{jabatanValue}</p>
          <p className="text-[10px] text-slate-400 mb-2">
            {new Date(signedAt).toLocaleString("id-ID")}
          </p>
          {barcode && <img src={barcode} alt="Barcode tanda tangan" className="mx-auto h-24" />}
          {!disabled && (
            <button
              type="button"
              onClick={handleGantiTandaTangan}
              className="text-[10px] text-navy-700 hover:underline mt-2"
            >
              Ganti tanda tangan
            </button>
          )}
        </div>
      ) : (
        <div className="text-center space-y-3">
          <div className="text-left">
            <label>Nama Penandatangan</label>
            {namaOptions ? (
              <select value={draftNama} onChange={(e) => setDraftNama(e.target.value)} disabled={disabled}>
                <option value="">-- Pilih Nama --</option>
                {namaOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={draftNama}
                onChange={(e) => setDraftNama(e.target.value)}
                placeholder="Ketik nama lengkap"
                disabled={disabled}
              />
            )}
          </div>

          {draftNama.trim() && !draftSignature && (
            <p
              className="text-2xl text-navy-900"
              style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
            >
              {draftNama}
            </p>
          )}

          <div className="text-left">
            <label>Coret Tanda Tangan (opsional, kalau kosong pakai gaya tulisan otomatis)</label>
            <SignaturePad onChange={setDraftSignature} disabled={disabled} />
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={disabled || !draftNama.trim()}
            className="btn-primary text-xs w-full"
          >
            Tanda Tangan
          </button>
        </div>
      )}
    </div>
  );
}
