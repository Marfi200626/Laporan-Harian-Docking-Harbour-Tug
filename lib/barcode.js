"use client";

import QRCode from "qrcode";

/**
 * Membuat "kode tanda tangan" unik dari data laporan + nama + waktu.
 * Kode ini yang di-encode ke dalam QR code.
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

function formatSignatureDate(isoTimestamp) {
  if (!isoTimestamp) return "";
  const d = new Date(isoTimestamp);
  // Format: "20 July 2026" (meniru contoh format yang diminta)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Membuat stempel tanda tangan berupa satu gambar PNG (data URL) berisi:
 * QR code (bisa dipindai untuk verifikasi) + Nama (tebal) + Jabatan
 * (huruf besar) + Tanggal tanda tangan.
 */
export async function generateSignatureStamp(code, nama, jabatan, isoTimestamp) {
  if (typeof document === "undefined") return null;

  try {
    const qrDataUrl = await QRCode.toDataURL(code, {
      width: 160,
      margin: 1,
      color: { dark: "#0b2545", light: "#ffffff" },
    });

    const qrImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrDataUrl;
    });

    const width = 200;
    const qrSize = 140;
    const height = qrSize + 80;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(qrImg, (width - qrSize) / 2, 6, qrSize, qrSize);

    ctx.textAlign = "center";
    ctx.fillStyle = "#0b2545";

    // Nama (bold, bisa 2 baris jika panjang)
    ctx.font = "bold 13px sans-serif";
    const words = (nama || "").split(" ");
    let line1 = "";
    let line2 = "";
    for (const w of words) {
      if (ctx.measureText(line1 + w).width < width - 16 && !line2) {
        line1 += (line1 ? " " : "") + w;
      } else {
        line2 += (line2 ? " " : "") + w;
      }
    }
    let y = qrSize + 22;
    ctx.fillText(line1, width / 2, y);
    if (line2) {
      y += 15;
      ctx.fillText(line2, width / 2, y);
    }

    // Jabatan (huruf besar)
    y += 18;
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText((jabatan || "").toUpperCase(), width / 2, y);

    // Tanggal
    y += 16;
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#0b2545";
    ctx.fillText(formatSignatureDate(isoTimestamp), width / 2, y);

    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
}
