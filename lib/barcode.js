"use client";

/**
 * Membuat "kode tanda tangan" unik dari data laporan + nama + waktu.
 */
export function buildSignatureCode(reportId, role, nama, isoTimestamp) {
  const shortId = (reportId || "").replace(/-/g, "").slice(0, 8).toUpperCase();
  const datePart = isoTimestamp ? isoTimestamp.slice(0, 10).replace(/-/g, "") : "";
  const namePart = (nama || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
  return `${shortId}-${role}-${namePart}-${datePart}`;
}

// Hash sederhana dan stabil (deterministik) dari sebuah string,
// dipakai untuk menentukan lebar batang barcode secara konsisten.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Menggambar barcode visual (bar pattern deterministik) beserta
 * kode teks, nama, dan tanggal tanda tangan ke dalam satu gambar PNG
 * (data URL). Tidak bergantung pada library luar sama sekali, jadi
 * tidak akan pernah gagal dimuat.
 */
export function generateSignatureStamp(code, nama, isoTimestamp) {
  if (typeof document === "undefined") return null;

  const width = 340;
  const height = 92;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Bar pattern (deterministik dari kode)
  const barAreaX = 8;
  const barAreaWidth = width - 16;
  const barHeight = 40;
  const barTop = 6;
  const seed = hashString(code);
  let x = barAreaX;
  let i = 0;
  ctx.fillStyle = "#0b2545";
  while (x < barAreaX + barAreaWidth - 4) {
    const w = 1 + ((seed >> (i % 24)) & 3); // lebar batang 1-4px, deterministik
    const isBar = i % 2 === 0;
    if (isBar) {
      ctx.fillRect(x, barTop, w, barHeight);
    }
    x += w;
    i++;
  }

  // Kode teks di bawah bar
  ctx.fillStyle = "#0b2545";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(code, width / 2, barTop + barHeight + 14);

  // Nama & tanggal
  const dateLabel = isoTimestamp
    ? new Date(isoTimestamp).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(nama || "", width / 2, barTop + barHeight + 32);
  ctx.font = "10px sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText(dateLabel, width / 2, barTop + barHeight + 46);

  return canvas.toDataURL("image/png");
}
