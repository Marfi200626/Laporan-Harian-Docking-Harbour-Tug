"use client";

import { useState } from "react";
import { generateSignatureStamp, buildSignatureCode } from "@/lib/barcode";

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
  const [signing, setSigning] = useState(false);

  const isSigned = Boolean(nama && signedAt);

  async function handleConfirm() {
    if (!draftNama.trim()) {
      alert("Ketik nama lengkap terlebih dahulu sebelum tanda tangan.");
      return;
    }
    setSigning(true);
    const timestamp = new Date().toISOString();
    const code = buildSignatureCode(reportId, roleCode, draftNama.trim(), timestamp);
    const stampDataUrl = await generateSignatureStamp(code, draftNama.trim(), jabatanValue, timestamp);
    setSigning(false);
    onSign({ nama: draftNama.trim(), timestamp, barcode: stampDataUrl, code });
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
          {barcode ? (
            <img src={barcode} alt="Tanda tangan" className="mx-auto" style={{ maxWidth: 180 }} />
          ) : (
            <p className="text-xs text-slate-400">Stempel tanda tangan tidak tersedia</p>
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
            disabled={disabled || signing || !draftNama.trim()}
            className="btn-primary text-xs w-full"
          >
            {signing ? "Membuat QR..." : "Tanda Tangan"}
          </button>
        </div>
      )}
    </div>
  );
}
