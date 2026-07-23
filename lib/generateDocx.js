"use client";

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  ImageRun,
  ShadingType,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

const HEADER_FILL = "5B9BD5";

function cell(text, { bold = false, width, fill, colSpan = 1, align } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: colSpan,
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align || AlignmentType.LEFT,
        children: [
          new TextRun({ text: text || "", bold, size: 20, color: fill ? "FFFFFF" : "000000" }),
        ],
      }),
    ],
  });
}

async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await blob.arrayBuffer();
  } catch (e) {
    return null;
  }
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sumberDayaLines(sd) {
  const crew = sd?.crew || {};
  const shipyard = sd?.shipyard || {};
  const teknisi = sd?.teknisi || {};
  return [
    "Sumber Daya",
    "Crew:",
    `  Deck: ${crew.deck ?? 0} Orang`,
    `  Engine: ${crew.engine ?? 0} Orang`,
    "Shipyard:",
    `  Welder: ${shipyard.welder ?? 0} Orang`,
    `  Piping: ${shipyard.piping ?? 0} Orang`,
    `  HSE: ${shipyard.hse ?? 0} Orang`,
    `  Docking Undocking: ${shipyard.docking_undocking ?? 0} Orang`,
    "Teknisi:",
    `  Teknisi ME: ${teknisi.me ?? 0} Orang`,
    `  Teknisi AE: ${teknisi.ae ?? 0} Orang`,
    `  Teknisi Electrician: ${teknisi.electrician ?? 0} Orang`,
  ];
}

async function buildHeader() {
  const logoBuf = await fetchImageBuffer("/logo-pt.png");
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: logoBuf
                      ? [new ImageRun({ data: logoBuf, transformation: { width: 50, height: 50 } })]
                      : [new TextRun({ text: "" })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 85, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "PT PELAYARAN MULTI JAYA SAMUDERA", bold: true, size: 20 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "LAPORAN HARIAN DOCKING", bold: true, italics: true, size: 26 })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function buildFooter() {
  const stampBuf = await fetchImageBuffer("/footer-stamp.png");
  return new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: stampBuf
                      ? [new ImageRun({ data: stampBuf, transformation: { width: 130, height: 18 } })]
                      : [new TextRun({ text: "INTERNAL USE ONLY", color: "C00000", bold: true, size: 16 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: "Hal ", size: 18 }),
                      new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                      new TextRun({ text: " dari ", size: 18 }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "FM.TB.414", italics: true, size: 18 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "Rev.000/Jan 2026", italics: true, size: 18 })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function signatureCell(report, role) {
  const isOS = role === "OS";
  const nama = isOS ? report.dibuat_oleh_nama : report.diketahui_oleh_nama;
  const jabatan = isOS ? report.jabatan || "Owner Superintendent" : "Operation Manager";
  const timestamp = isOS ? report.ditandatangani_os_at : report.ditandatangani_om_at;
  const barcode = isOS ? report.dibuat_oleh_barcode : report.diketahui_oleh_barcode;

  const children = [
    new Paragraph({ text: isOS ? "Dibuat Oleh," : "Diketahui Oleh," }),
    new Paragraph({ text: "" }),
  ];

  if (barcode) {
    try {
      const bytes = dataUrlToUint8Array(barcode);
      children.push(
        new Paragraph({
          children: [new ImageRun({ data: bytes, transformation: { width: 140, height: 45 } })],
        })
      );
    } catch (e) {
      children.push(new Paragraph({ text: "" }));
    }
  } else {
    children.push(new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }));
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: nama || ".........................",
          italics: true,
          size: 30,
          font: "Segoe Script",
        }),
      ],
    }),
    new Paragraph({ text: `(${nama || "........................."})` }),
    new Paragraph({ text: jabatan }),
    timestamp
      ? new Paragraph({
          children: [
            new TextRun({
              text: `Ditandatangani: ${new Date(timestamp).toLocaleString("id-ID")}`,
              size: 16,
              italics: true,
            }),
          ],
        })
      : new Paragraph({ text: "" })
  );

  return new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children });
}

export async function exportReportToDocx(report, photos) {
  const jadwal = report.jadwal_kegiatan || [];
  const kendala = report.kendala || [];
  const pekerjaan = report.pekerjaan_dock || {};
  const notes = report.additional_notes || [];

  const header = await buildHeader();
  const footer = await buildFooter();

  // ---- Data Umum table ----
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("Nama OS/DS/TS", { width: 15 }),
          cell(":", { width: 2 }),
          cell(report.nama_os || "", { width: 33 }),
          cell("Nama Kapal", { width: 15 }),
          cell(":", { width: 2 }),
          cell(report.nama_kapal || "", { width: 33 }),
        ],
      }),
      new TableRow({
        children: [
          cell("Jabatan"),
          cell(":"),
          cell(report.jabatan || ""),
          cell("Jenis Survei"),
          cell(":"),
          cell(report.jenis_survei || ""),
        ],
      }),
      new TableRow({
        children: [
          cell("Divisi/Dept."),
          cell(":"),
          cell(report.divisi || ""),
          cell("Hari, tanggal"),
          cell(":"),
          cell(report.hari_tanggal || ""),
        ],
      }),
      new TableRow({
        children: [
          cell("Docking Terakhir"),
          cell(":"),
          cell(report.docking_terakhir || ""),
          cell("Lokasi Docking"),
          cell(":"),
          cell(report.lokasi_docking || ""),
        ],
      }),
    ],
  });

  // ---- Jadwal Deskripsi Kegiatan table ----
  const jadwalRows = [
    new TableRow({
      children: [cell("JADWAL DESKRIPSI KEGIATAN", { bold: true, fill: HEADER_FILL, colSpan: 4, align: AlignmentType.CENTER })],
    }),
    new TableRow({
      children: [
        cell("A.", { bold: true, width: 6 }),
        cell("Kegiatan", { bold: true, width: 34, align: AlignmentType.CENTER }),
        cell("Target", { bold: true, width: 30, align: AlignmentType.CENTER }),
        cell("Aktual", { bold: true, width: 30, align: AlignmentType.CENTER }),
      ],
    }),
    ...jadwal.map(
      (item) =>
        new TableRow({
          children: [cell(`${item.no}.`), cell(item.kegiatan || ""), cell(item.target || ""), cell(item.aktual || "")],
        })
    ),
  ];
  const jadwalTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: jadwalRows });

  // ---- Kendala table ----
  const kendalaRows = [
    new TableRow({
      children: [cell("No.", { bold: true, width: 8 }), cell("Kendala Jadwal Kegiatan (cuaca, dock, manpower)", { bold: true, width: 92 })],
    }),
    ...(kendala.length > 0
      ? kendala.map((k) => new TableRow({ children: [cell(`${k.no}.`), cell(k.deskripsi || "")] }))
      : [new TableRow({ children: [cell("1."), cell("")] })]),
  ];
  const kendalaTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: kendalaRows });

  // ---- Pekerjaan Dock table ----
  const poList = (pekerjaan.outstanding_po || []).filter((p) => p && (p.no_po || p.nama_barang || p.outstanding));

  const poRows =
    poList.length > 0
      ? poList.map(
          (po) =>
            new TableRow({
              children: [
                cell(""),
                cell(`No. PO: ${po.no_po || "-"}\nNama Barang: ${po.nama_barang || "-"}\nOutstanding: ${po.outstanding || "-"}`),
              ],
            })
        )
      : [new TableRow({ children: [cell(""), cell("Tidak ada barang outstanding")] })];

  const pekerjaanTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("", { width: 6 }),
          cell(`Pekerjaan Dock                         Update Pekerjaan: ${pekerjaan.progress_percent ?? 0}%`, { bold: true, width: 94 }),
        ],
      }),
      new TableRow({ children: [cell("1."), cell("Deck", { bold: true })] }),
      new TableRow({ children: [cell(""), cell(`Crew: ${pekerjaan.deck?.crew || "-"}`)] }),
      new TableRow({ children: [cell(""), cell(`Shipyard: ${pekerjaan.deck?.shipyard || "-"}`)] }),
      new TableRow({ children: [cell("2."), cell("Engine", { bold: true })] }),
      new TableRow({ children: [cell(""), cell(`Crew: ${pekerjaan.engine?.crew || "-"}`)] }),
      new TableRow({ children: [cell(""), cell(`Shipyard: ${pekerjaan.engine?.shipyard || "-"}`)] }),
      new TableRow({ children: [cell(""), cell(`Workshop: ${pekerjaan.engine?.workshop || "-"}`)] }),
      new TableRow({ children: [cell("3."), cell(`Outstanding pekerjaan: ${pekerjaan.outstanding_pekerjaan || "-"}`)] }),
      new TableRow({ children: [cell("4."), cell("Outstanding Permintaan Barang", { bold: true })] }),
      ...poRows,
      new TableRow({ children: [cell("5."), cell(sumberDayaLines(pekerjaan.sumber_daya).join("\n"))] }),
    ],
  });

  // ---- Foto dokumentasi (galeri bernomor, tanpa batas jumlah) ----
  const photoTables = [];
  if (photos.length > 0) {
    const rows = [
      new TableRow({
        children: [
          cell("Foto Dokumentasi Pemeriksaan/Pelaksanaan (Foto dapat disesuaikan dengan kebutuhan)", {
            bold: true,
            fill: HEADER_FILL,
            colSpan: 2,
            align: AlignmentType.CENTER,
          }),
        ],
      }),
    ];

    for (let i = 0; i < photos.length; i += 2) {
      const pair = photos.slice(i, i + 2);
      const imgCells = [];
      for (const p of pair) {
        const buf = await fetchImageBuffer(p.url);
        imgCells.push(
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              buf
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new ImageRun({ data: buf, transformation: { width: 220, height: 165 } })],
                  })
                : new Paragraph({ text: "(gambar tidak dapat dimuat)" }),
            ],
          })
        );
      }
      if (pair.length === 1) {
        imgCells.push(new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph("")] }));
      }
      rows.push(new TableRow({ children: imgCells }));

      const capCells = pair.map((p, idx) => {
        const photoNumber = i + idx + 1;
        return new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `Foto ${photoNumber}: `, bold: true, size: 18 }),
                new TextRun({ text: p.caption || "Penjelasan Foto", size: 18 }),
              ],
            }),
          ],
        });
      });
      if (pair.length === 1) {
        capCells.push(new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph("")] }));
      }
      rows.push(new TableRow({ children: capCells }));
    }

    photoTables.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
    photoTables.push(new Paragraph({ text: "" }));
  }

  // ---- Additional notes ----
  const notesRows = [
    new TableRow({ children: [cell("No", { bold: true, width: 10 }), cell("ADDITIONAL NOTES", { bold: true, width: 90 })] }),
    ...(notes.length > 0
      ? notes.map((n) => new TableRow({ children: [cell(`${n.no}`), cell(n.catatan || "")] }))
      : [new TableRow({ children: [cell(""), cell("")] })]),
  ];
  const notesTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: notesRows });

  // ---- Signature table (with barcode) ----
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [signatureCell(report, "OS"), signatureCell(report, "OM")] })],
  });

  const doc = new Document({
    sections: [
      {
        headers: { default: header },
        footers: { default: footer },
        children: [
          new Paragraph({ text: "" }),
          headerTable,
          new Paragraph({ text: "" }),
          jadwalTable,
          new Paragraph({ text: "" }),
          kendalaTable,
          new Paragraph({ text: "" }),
          pekerjaanTable,
          new Paragraph({ text: "" }),
          ...photoTables,
          notesTable,
          new Paragraph({ text: "" }),
          signatureTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `FM.TB.414_${(report.nama_kapal || "Laporan").replace(/[^a-zA-Z0-9]/g, "_")}_${report.hari_tanggal || ""}.docx`;
  saveAs(blob, fileName);
}

// =========================================================
// EXPORT KE PDF
// Menggunakan fitur cetak bawaan browser ("Save as PDF") lewat
// jendela cetak khusus, supaya tidak perlu library tambahan yang
// berat dan tetap bisa dipakai dari HP.
// =========================================================
export async function exportReportToPdf(report, photos) {
  const jadwal = report.jadwal_kegiatan || [];
  const kendala = report.kendala || [];
  const pekerjaan = report.pekerjaan_dock || {};
  const notes = report.additional_notes || [];
  const sd = pekerjaan.sumber_daya || {};
  const poList = (pekerjaan.outstanding_po || []).filter((p) => p && (p.no_po || p.nama_barang || p.outstanding));

  const esc = (s) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const photoHtml = photos
    .map(
      (p, i) => `
      <div class="photo-item">
        <img src="${p.url}" />
        <p><strong>Foto ${i + 1}:</strong> ${esc(p.caption || "Penjelasan Foto")}</p>
      </div>`
    )
    .join("");

  const jadwalHtml = jadwal
    .map(
      (item) => `<tr><td>${item.no}.</td><td>${esc(item.kegiatan)}</td><td>${esc(item.target)}</td><td>${esc(item.aktual)}</td></tr>`
    )
    .join("");

  const kendalaHtml =
    kendala.length > 0
      ? kendala.map((k) => `<tr><td class="w40">${k.no}.</td><td>${esc(k.deskripsi)}</td></tr>`).join("")
      : `<tr><td class="w40">1.</td><td></td></tr>`;

  const poHtml =
    poList.length > 0
      ? poList
          .map(
            (po) => `<tr><td class="w40"></td><td>No. PO: ${esc(po.no_po)}<br/>Nama Barang: ${esc(po.nama_barang)}<br/>Outstanding: ${esc(po.outstanding)}</td></tr>`
          )
          .join("")
      : `<tr><td class="w40"></td><td>Tidak ada barang outstanding</td></tr>`;

  const notesHtml =
    notes.length > 0
      ? notes.map((n) => `<tr><td class="w40">${n.no}</td><td>${esc(n.catatan)}</td></tr>`).join("")
      : `<tr><td class="w40"></td><td></td></tr>`;

  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
  <meta charset="utf-8" />
  <title>FM.TB.414 - ${esc(report.nama_kapal || "Laporan")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12px; color: #000; margin: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #0b2545; padding-bottom: 8px; margin-bottom: 16px; }
    .brand img { width: 50px; height: 50px; }
    .brand h1 { font-size: 16px; margin: 0; }
    .brand h2 { font-size: 14px; margin: 0; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    td, th { border: 1px solid #333; padding: 5px 8px; vertical-align: top; }
    th { background: #5B9BD5; color: #fff; }
    .w40 { width: 40px; }
    .section-title { background: #5B9BD5; color: #fff; text-align: center; font-weight: bold; padding: 6px; }
    .photos { display: flex; flex-wrap: wrap; gap: 10px; }
    .photo-item { width: 47%; border: 1px solid #ccc; padding: 6px; }
    .photo-item img { width: 100%; height: 150px; object-fit: cover; }
    .sig-wrap { display: flex; justify-content: space-between; margin-top: 20px; }
    .sig-box { width: 47%; text-align: left; }
    .sig-name { font-family: 'Brush Script MT', cursive; font-size: 26px; margin: 6px 0 0; }
    .sig-barcode { height: 45px; margin-top: 10px; }
    footer.page-footer { display: flex; justify-content: space-between; font-size: 10px; margin-top: 24px; border-top: 1px solid #999; padding-top: 6px; }
    .internal { color: #C00000; font-weight: bold; border: 1px solid #C00000; padding: 2px 6px; display: inline-block; }
    @media print {
      body { margin: 12mm; }
    }
  </style>
  </head>
  <body>
    <div class="brand">
      <img src="${window.location.origin}/logo-pt.png" />
      <div>
        <h1>PT PELAYARAN MULTI JAYA SAMUDERA</h1>
        <h2>LAPORAN HARIAN DOCKING</h2>
      </div>
    </div>

    <table>
      <tr><td>Nama OS/DS/TS</td><td>:</td><td>${esc(report.nama_os)}</td><td>Nama Kapal</td><td>:</td><td>${esc(report.nama_kapal)}</td></tr>
      <tr><td>Jabatan</td><td>:</td><td>${esc(report.jabatan)}</td><td>Jenis Survei</td><td>:</td><td>${esc(report.jenis_survei)}</td></tr>
      <tr><td>Divisi/Dept.</td><td>:</td><td>${esc(report.divisi)}</td><td>Hari, tanggal</td><td>:</td><td>${esc(report.hari_tanggal)}</td></tr>
      <tr><td>Docking Terakhir</td><td>:</td><td>${esc(report.docking_terakhir)}</td><td>Lokasi Docking</td><td>:</td><td>${esc(report.lokasi_docking)}</td></tr>
    </table>

    <table>
      <tr><th colspan="4">JADWAL DESKRIPSI KEGIATAN</th></tr>
      <tr><th>A.</th><th>Kegiatan</th><th>Target</th><th>Aktual</th></tr>
      ${jadwalHtml}
    </table>

    <table>
      <tr><th colspan="2">Kendala Jadwal Kegiatan (cuaca, dock, manpower)</th></tr>
      ${kendalaHtml}
    </table>

    <table>
      <tr><td class="w40"></td><td><strong>Pekerjaan Dock &nbsp;&nbsp;&nbsp; Update Pekerjaan: ${pekerjaan.progress_percent ?? 0}%</strong></td></tr>
      <tr><td class="w40">1.</td><td><strong>Deck</strong></td></tr>
      <tr><td class="w40"></td><td>Crew: ${esc(pekerjaan.deck?.crew || "-")}</td></tr>
      <tr><td class="w40"></td><td>Shipyard: ${esc(pekerjaan.deck?.shipyard || "-")}</td></tr>
      <tr><td class="w40">2.</td><td><strong>Engine</strong></td></tr>
      <tr><td class="w40"></td><td>Crew: ${esc(pekerjaan.engine?.crew || "-")}</td></tr>
      <tr><td class="w40"></td><td>Shipyard: ${esc(pekerjaan.engine?.shipyard || "-")}</td></tr>
      <tr><td class="w40"></td><td>Workshop: ${esc(pekerjaan.engine?.workshop || "-")}</td></tr>
      <tr><td class="w40">3.</td><td>Outstanding pekerjaan: ${esc(pekerjaan.outstanding_pekerjaan || "-")}</td></tr>
      <tr><td class="w40">4.</td><td><strong>Outstanding Permintaan Barang</strong></td></tr>
      ${poHtml}
      <tr><td class="w40">5.</td><td>
        <strong>Sumber Daya</strong><br/>
        Crew &mdash; Deck: ${sd.crew?.deck ?? 0} Orang, Engine: ${sd.crew?.engine ?? 0} Orang<br/>
        Shipyard &mdash; Welder: ${sd.shipyard?.welder ?? 0}, Piping: ${sd.shipyard?.piping ?? 0}, HSE: ${sd.shipyard?.hse ?? 0}, Docking Undocking: ${sd.shipyard?.docking_undocking ?? 0}<br/>
        Teknisi &mdash; ME: ${sd.teknisi?.me ?? 0}, AE: ${sd.teknisi?.ae ?? 0}, Electrician: ${sd.teknisi?.electrician ?? 0}
      </td></tr>
    </table>

    ${photos.length > 0 ? `<div class="section-title">Foto Dokumentasi Pemeriksaan/Pelaksanaan</div><div class="photos">${photoHtml}</div>` : ""}

    <table>
      <tr><th class="w40">No</th><th>ADDITIONAL NOTES</th></tr>
      ${notesHtml}
    </table>

    <div class="sig-wrap">
      <div class="sig-box">
        <p>Dibuat Oleh,</p>
        ${report.dibuat_oleh_barcode ? `<img class="sig-barcode" src="${report.dibuat_oleh_barcode}" />` : ""}
        <p class="sig-name">${esc(report.dibuat_oleh_nama || "")}</p>
        <p>(${esc(report.dibuat_oleh_nama || ".........................")})</p>
        <p>${esc(report.jabatan || "Owner Superintendent")}</p>
      </div>
      <div class="sig-box">
        <p>Diketahui Oleh,</p>
        ${report.diketahui_oleh_barcode ? `<img class="sig-barcode" src="${report.diketahui_oleh_barcode}" />` : ""}
        <p class="sig-name">${esc(report.diketahui_oleh_nama || "")}</p>
        <p>(${esc(report.diketahui_oleh_nama || ".........................")})</p>
        <p>Operation Manager</p>
      </div>
    </div>

    <footer class="page-footer">
      <span class="internal">INTERNAL USE ONLY</span>
      <span>FM.TB.414 &nbsp; Rev.000/Jan 2026</span>
    </footer>

    <script>
      window.onload = function () {
        setTimeout(function () { window.print(); }, 400);
      };
    </script>
  </body>
  </html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.");
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
