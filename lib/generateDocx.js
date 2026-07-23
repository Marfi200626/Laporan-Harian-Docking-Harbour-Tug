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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    `  Team Propulsi: ${shipyard.propulsi ?? 0} Orang`,
    "Teknisi:",
    `  Teknisi ME: ${teknisi.me ?? 0} Orang`,
    `  Teknisi AE: ${teknisi.ae ?? 0} Orang`,
    `  Teknisi Electrician: ${teknisi.electrician ?? 0} Orang`,
    `  Team Propulsi: ${teknisi.propulsi ?? 0} Orang`,
  ];
}

async function buildHeader() {
  const logoBuf = await fetchImageBuffer("/logo-pt.png");
  const tugboatBuf = await fetchImageBuffer("/tugboat.png");
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "0B2545" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
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
                      ? [new ImageRun({ data: logoBuf, transformation: { width: 45, height: 45 } })]
                      : [new TextRun({ text: "" })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
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
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: tugboatBuf
                      ? [new ImageRun({ data: tugboatBuf, transformation: { width: 55, height: 33 } })]
                      : [new TextRun({ text: "" })],
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
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: bytes, transformation: { width: 110, height: 121 } })],
        })
      );
    } catch (e) {
      children.push(new Paragraph({ text: `(${nama || "........................."})` }));
    }
  } else {
    children.push(
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `(${nama || "........................."})` })
    );
  }

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
  const poList = (pekerjaan.outstanding_po || []).filter((p) => p && (p.no_po || (p.items || []).some((it) => it.nama_barang || it.outstanding)));

  const poRows =
    poList.length > 0
      ? poList.map((po) => {
          const itemLines = (po.items || [])
            .filter((it) => it.nama_barang || it.outstanding)
            .map((it, idx) => `  ${idx + 1}. ${it.nama_barang || "-"} — Outstanding: ${it.outstanding || "-"}`)
            .join("\n");
          return new TableRow({
            children: [cell(""), cell(`No. PO: ${po.no_po || "-"}\n${itemLines || "(belum ada barang diisi)"}`)],
          });
        })
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
// Menggunakan jsPDF supaya header/footer konsisten muncul di
// SETIAP halaman, dan nomor halaman ("Hal X dari Y") akurat
// sesuai jumlah halaman sebenarnya.
// =========================================================

const MARGIN = 12;
const HEADER_BOTTOM_Y = 30;
const FOOTER_TOP_Y_OFFSET = 16; // jarak dari bawah halaman

async function urlToDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 4, h: 3 });
    img.src = dataUrl;
  });
}

function drawPdfHeader(doc, logoDataUrl, tugboatDataUrl) {
  const pageWidth = doc.internal.pageSize.getWidth();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", MARGIN, 6, 16, 16);
    } catch (e) {
      /* ignore broken image */
    }
  }
  if (tugboatDataUrl) {
    try {
      doc.addImage(tugboatDataUrl, "PNG", pageWidth - MARGIN - 24, 7, 24, 14);
    } catch (e) {
      /* ignore broken image */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("PT PELAYARAN MULTI JAYA SAMUDERA", pageWidth / 2, 12, { align: "center" });
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(14);
  doc.text("LAPORAN HARIAN DOCKING", pageWidth / 2, 19, { align: "center" });
  doc.setDrawColor(11, 37, 69);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 24, pageWidth - MARGIN, 24);
}

function drawPdfFooter(doc, pageNum, totalPages) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y1 = pageHeight - FOOTER_TOP_Y_OFFSET + 6;
  const y2 = y1 + 4;

  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y1 - 5, pageWidth - MARGIN, y1 - 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(192, 0, 0);
  doc.text("INTERNAL USE ONLY", MARGIN, y1);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Hal ${pageNum} dari ${totalPages}`, pageWidth / 2, y1, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.text("FM.TB.414", pageWidth - MARGIN, y1, { align: "right" });
  doc.text("Rev.000/Jan 2026", pageWidth - MARGIN, y2, { align: "right" });
}

function addPdfPage(doc, logoDataUrl, tugboatDataUrl) {
  doc.addPage();
  drawPdfHeader(doc, logoDataUrl, tugboatDataUrl);
}

function ensureSpace(doc, cursorY, needed, logoDataUrl, tugboatDataUrl) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const limit = pageHeight - FOOTER_TOP_Y_OFFSET - 4;
  if (cursorY + needed > limit) {
    addPdfPage(doc, logoDataUrl, tugboatDataUrl);
    return HEADER_BOTTOM_Y + 4;
  }
  return cursorY;
}

export async function exportReportToPdf(report, photos) {
  const jadwal = report.jadwal_kegiatan || [];
  const kendala = report.kendala || [];
  const pekerjaan = report.pekerjaan_dock || {};
  const notes = report.additional_notes || [];
  const sd = pekerjaan.sumber_daya || {};
  const poList = (pekerjaan.outstanding_po || []).filter(
    (p) => p && (p.no_po || (p.items || []).some((it) => it.nama_barang || it.outstanding))
  );

  const logoDataUrl = await urlToDataUrl("/logo-pt.png");
  const tugboatDataUrl = await urlToDataUrl("/tugboat.png");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;

  drawPdfHeader(doc, logoDataUrl, tugboatDataUrl);
  let cursorY = HEADER_BOTTOM_Y;

  // ---- Data Umum ----
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_BOTTOM_Y },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 }, 3: { fontStyle: "bold", cellWidth: 30 } },
    body: [
      ["Nama OS/DS/TS", report.nama_os || "", "Nama Kapal", report.nama_kapal || ""],
      ["Jabatan", report.jabatan || "", "Jenis Survei", report.jenis_survei || ""],
      ["Divisi/Dept.", report.divisi || "", "Hari, tanggal", report.hari_tanggal || ""],
      ["Docking Terakhir", report.docking_terakhir || "", "Lokasi Docking", report.lokasi_docking || ""],
    ],
    didDrawPage: () => drawPdfHeader(doc, logoDataUrl, tugboatDataUrl),
  });
  cursorY = doc.lastAutoTable.finalY + 6;

  // ---- Jadwal Deskripsi Kegiatan ----
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_BOTTOM_Y },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    head: [["No", "Kegiatan", "Target", "Aktual"]],
    headStyles: { fillColor: [91, 155, 213], textColor: 255, fontStyle: "bold" },
    body: jadwal.map((it) => [`${it.no}.`, it.kegiatan || "", it.target || "", it.aktual || ""]),
    didDrawPage: () => drawPdfHeader(doc, logoDataUrl, tugboatDataUrl),
  });
  cursorY = doc.lastAutoTable.finalY + 6;

  // ---- Kendala ----
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_BOTTOM_Y },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    head: [["No", "Kendala Jadwal Kegiatan (cuaca, dock, manpower)"]],
    headStyles: { fillColor: [91, 155, 213], textColor: 255, fontStyle: "bold" },
    body:
      kendala.length > 0
        ? kendala.map((k) => [`${k.no}.`, k.deskripsi || ""])
        : [["1.", ""]],
    columnStyles: { 0: { cellWidth: 10 } },
    didDrawPage: () => drawPdfHeader(doc, logoDataUrl, tugboatDataUrl),
  });
  cursorY = doc.lastAutoTable.finalY + 6;

  // ---- Pekerjaan Dock ----
  const poText =
    poList.length > 0
      ? poList
          .map((po) => {
            const items = (po.items || [])
              .filter((it) => it.nama_barang || it.outstanding)
              .map((it, idx) => `   ${idx + 1}. ${it.nama_barang || "-"} — Outstanding: ${it.outstanding || "-"}`)
              .join("\n");
            return `No. PO: ${po.no_po || "-"}\n${items || "(belum ada barang diisi)"}`;
          })
          .join("\n\n")
      : "Tidak ada barang outstanding";

  const sumberDayaText = [
    `Crew — Deck: ${sd.crew?.deck ?? 0} Orang, Engine: ${sd.crew?.engine ?? 0} Orang`,
    `Shipyard — Welder: ${sd.shipyard?.welder ?? 0}, Piping: ${sd.shipyard?.piping ?? 0}, HSE: ${sd.shipyard?.hse ?? 0}, Docking Undocking: ${sd.shipyard?.docking_undocking ?? 0}`,
    `Teknisi — ME: ${sd.teknisi?.me ?? 0}, AE: ${sd.teknisi?.ae ?? 0}, Electrician: ${sd.teknisi?.electrician ?? 0}`,
  ].join("\n");

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_BOTTOM_Y },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8, valign: "top" },
    columnStyles: { 0: { cellWidth: 10, fontStyle: "bold" } },
    body: [
      ["", { content: `Pekerjaan Dock — Update Pekerjaan: ${pekerjaan.progress_percent ?? 0}%`, styles: { fontStyle: "bold" } }],
      ["1.", { content: "Deck", styles: { fontStyle: "bold" } }],
      ["", `Crew: ${pekerjaan.deck?.crew || "-"}`],
      ["", `Shipyard: ${pekerjaan.deck?.shipyard || "-"}`],
      ["2.", { content: "Engine", styles: { fontStyle: "bold" } }],
      ["", `Crew: ${pekerjaan.engine?.crew || "-"}`],
      ["", `Shipyard: ${pekerjaan.engine?.shipyard || "-"}`],
      ["", `Workshop: ${pekerjaan.engine?.workshop || "-"}`],
      ["3.", `Outstanding pekerjaan: ${pekerjaan.outstanding_pekerjaan || "-"}`],
      ["4.", { content: `Outstanding Permintaan Barang\n${poText}` }],
      ["5.", { content: `Sumber Daya\n${sumberDayaText}` }],
    ],
    didDrawPage: () => drawPdfHeader(doc, logoDataUrl, tugboatDataUrl),
  });
  cursorY = doc.lastAutoTable.finalY + 6;

  // ---- Foto Dokumentasi ----
  if (photos.length > 0) {
    cursorY = ensureSpace(doc, cursorY, 10, logoDataUrl, tugboatDataUrl);
    doc.setFillColor(91, 155, 213);
    doc.rect(MARGIN, cursorY, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Foto Dokumentasi Pemeriksaan/Pelaksanaan", pageWidth / 2, cursorY + 5, { align: "center" });
    doc.setTextColor(0, 0, 0);
    cursorY += 12;

    const colGap = 6;
    const colWidth = (contentWidth - colGap) / 2;
    const imgHeight = 55;
    let col = 0;

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const dataUrl = await urlToDataUrl(p.url);

      cursorY = ensureSpace(doc, cursorY, imgHeight + 12, logoDataUrl, tugboatDataUrl);

      const x = MARGIN + col * (colWidth + colGap);

      if (dataUrl) {
        try {
          const { w, h } = await getImageDimensions(dataUrl);
          const ratio = Math.min(colWidth / w, imgHeight / h);
          const drawW = w * ratio;
          const drawH = h * ratio;
          const offsetX = x + (colWidth - drawW) / 2;
          doc.setDrawColor(220, 220, 220);
          doc.rect(x, cursorY, colWidth, imgHeight);
          doc.addImage(dataUrl, "PNG", offsetX, cursorY + (imgHeight - drawH) / 2, drawW, drawH);
        } catch (e) {
          doc.text("(gambar tidak dapat dimuat)", x + 2, cursorY + imgHeight / 2);
        }
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const captionText = `Foto ${i + 1}: ${p.caption || "Penjelasan Foto"}`;
      const captionLines = doc.splitTextToSize(captionText, colWidth);
      doc.text(captionLines, x, cursorY + imgHeight + 5);

      if (col === 1) {
        col = 0;
        cursorY += imgHeight + 12;
      } else {
        col = 1;
      }
    }
    if (col === 1) cursorY += imgHeight + 12;
    cursorY += 4;
  }

  // ---- Additional Notes ----
  cursorY = ensureSpace(doc, cursorY, 20, logoDataUrl, tugboatDataUrl);
  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN, top: HEADER_BOTTOM_Y },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    head: [["No", "ADDITIONAL NOTES"]],
    headStyles: { fillColor: [91, 155, 213], textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10 } },
    body: notes.length > 0 ? notes.map((n) => [`${n.no}`, n.catatan || ""]) : [["", ""]],
    didDrawPage: () => drawPdfHeader(doc, logoDataUrl, tugboatDataUrl),
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  // ---- Tanda Tangan ----
  cursorY = ensureSpace(doc, cursorY, 60, logoDataUrl, tugboatDataUrl);
  const sigColWidth = (contentWidth - 10) / 2;

  async function drawSignatureBox(x, label, nama, jabatan, timestamp, barcode) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, cursorY);

    let y = cursorY + 4;
    if (barcode) {
      try {
        const { w, h } = await getImageDimensions(barcode);
        const drawW = 40;
        const drawH = (h / w) * drawW;
        doc.addImage(barcode, "PNG", x, y, drawW, drawH);
        y += drawH + 3;
      } catch (e) {
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(13);
        doc.text(nama || "-", x, y);
        y += 5;
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`(${nama || "........................."})`, x, y);
      y += 4;
      doc.text(jabatan || "", x, y);
    }
  }

  await drawSignatureBox(
    MARGIN,
    "Dibuat Oleh,",
    report.dibuat_oleh_nama,
    report.jabatan || "Owner Superintendent",
    report.ditandatangani_os_at,
    report.dibuat_oleh_barcode
  );
  await drawSignatureBox(
    MARGIN + sigColWidth + 10,
    "Diketahui Oleh,",
    report.diketahui_oleh_nama,
    "Operation Manager",
    report.ditandatangani_om_at,
    report.diketahui_oleh_barcode
  );

  // ---- Footer di semua halaman (dengan total halaman akurat) ----
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPdfFooter(doc, p, totalPages);
  }

  const fileName = `FM.TB.414_${(report.nama_kapal || "Laporan").replace(/[^a-zA-Z0-9]/g, "_")}_${report.hari_tanggal || ""}.pdf`;
  doc.save(fileName);
}
