"use client";

import JsBarcode from "jsbarcode";

/**
 * Generate a barcode (Code128) as a PNG data URL from arbitrary text.
 * Used both for on-screen signature preview and for embedding into
 * the exported Word document.
 */
export function generateBarcodeDataUrl(text) {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 6,
      background: "#ffffff",
      lineColor: "#0b2545",
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
}

/**
 * Build a unique, verifiable code for a signature based on the report
 * id, the role signing, the signer's name, and the timestamp.
 */
export function buildSignatureCode(reportId, role, nama, isoTimestamp) {
  const shortId = (reportId || "").replace(/-/g, "").slice(0, 8).toUpperCase();
  const datePart = isoTimestamp ? isoTimestamp.slice(0, 10).replace(/-/g, "") : "";
  const namePart = (nama || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
  return `${shortId}-${role}-${namePart}-${datePart}`;
}
