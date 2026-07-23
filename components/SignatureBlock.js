"use client";

import { useState } from "react";
import { generateBarcodeDataUrl, buildSignatureCode } from "@/lib/barcode";

export default function SignatureBlock({
  title,
  roleCode, // "OS" | "OM"
  nama,
  jabatanValue,
  barcode,
  signedAt,
  reportId,
  disabled,
  jabatanOptions,
  onJabatanChange,
  onSign,
}) {
  const [draftNama, setDraftNama] = useState(nama || "");

  const isSigned = Boolean(nama && signedAt);

  function handleConfirm() {
    if (!draftNama.trim()) {
      alert("Ketik nama lengkap terlebih dahulu sebelum tanda tangan.");
      return;
    }
    const timestamp = new Date().toISOString();
    const code = buildSignatureCode(reportId, roleCode, draftNama.trim(), timestamp);
    const barcodeDataUrl = generateBarcodeDataUrl(code);
    onSign({ nama: draftNama.trim(), timestamp, barcode: barcodeDataUrl, code });
  }

  return (
    <div className="border border-dashed border-slate-300 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-2">{title}</p>

      {jabatanOptions && !isSigned && (
        <div className="mb-3 text-left">
          <label>Jabatan</label>
          <select value={jabatanValue} onChange={(e) => onJabatanChange(e.target.value)}>
            {jabatanOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {isSigned ? (
        <div className="text-center">
          <p
            className="text-3xl text-navy-900 mb-1"
            style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
          >
            {nama}
          </p>
          <p className="text-xs font-semibold text-navy-800">{jabatanValue}</p>
          <p className="text-[10px] text-slate-400 mb-2">
            {new Date(signedAt).toLocaleString("id-ID")}
          </p>
          {barcode && (
            <img src={barcode} alt="Barcode tanda tangan" className="mx-auto h-10" />
          )}
        </div>
      ) : (
        <div className="text-center space-y-2">
          <input
            type="text"
            value={draftNama}
            onChange={(e) => setDraftNama(e.target.value)}
            placeholder="Ketik nama lengkap Anda"
            disabled={disabled}
          />
          {draftNama.trim() && (
            <p
              className="text-3xl text-navy-900"
              style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
            >
              {draftNama}
            </p>
          )}
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
