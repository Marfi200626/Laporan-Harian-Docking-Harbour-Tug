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

function labelValueRow(label, value) {
  return new TableRow({
    children: [
      cell(label, { width: 20 }),
      cell(":", { width: 2 }),
      cell(value, { width: 28 }),
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

export async function exportReportToDocx(report, photos) {
  const jadwal = report.jadwal_kegiatan || [];
  const kendala = report.kendala || [];
  const pekerjaan = report.pekerjaan_dock || {};
  const notes = report.additional_notes || [];

  // ---- Header table (Image 1 layout) ----
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("Nama OS/DS", { width: 15 }),
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

  // ---- Jadwal Deskripsi Kegiatan table (Image 2 layout) ----
  const jadwalRows = [
    new TableRow({
      children: [
        cell("JADWAL DESKRIPSI KEGIATAN", { bold: true, fill: HEADER_FILL, colSpan: 4, align: AlignmentType.CENTER }),
      ],
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
          children: [
            cell(`${item.no}.`),
            cell(item.kegiatan || ""),
            cell(item.target || ""),
            cell(item.aktual || ""),
          ],
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
  const poList = (pekerjaan.outstanding_po || []).filter(Boolean);
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
      new TableRow({
        children: [
          cell("4."),
          cell(
            "Outstanding Permintaan Barang\n" +
              (poList.length > 0 ? poList.map((po) => `PO No. ${po}`).join("\n") : "PO No. -")
          ),
        ],
      }),
      new TableRow({
        children: [
          cell("5."),
          cell(
            `Sumber Daya\nCrew: ${pekerjaan.sumber_daya?.crew ?? 0} Orang\nShipyard: ${
              pekerjaan.sumber_daya?.shipyard ?? 0
            } Orang\nTeknisi: ${pekerjaan.sumber_daya?.teknisi ?? 0} Orang`
          ),
        ],
      }),
    ],
  });

  // ---- Foto dokumentasi (grouped by section) ----
  const grouped = photos.reduce((acc, p) => {
    const key = p.section || "Umum";
    acc[key] = acc[key] || [];
    acc[key].push(p);
    return acc;
  }, {});

  const photoTables = [];
  for (const [section, list] of Object.entries(grouped)) {
    const rows = [
      new TableRow({
        children: [cell(`Foto Dokumentasi - ${section}`, { bold: true, fill: HEADER_FILL, colSpan: 2, align: AlignmentType.CENTER })],
      }),
    ];

    for (let i = 0; i < list.length; i += 2) {
      const pair = list.slice(i, i + 2);
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
                    children: [
                      new ImageRun({
                        data: buf,
                        transformation: { width: 220, height: 165 },
                      }),
                    ],
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

      const capCells = pair.map(
        (p) =>
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.caption || "Penjelasan Foto", size: 18 })] })],
          })
      );
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

  // ---- Signature table ----
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ text: "Dibuat Oleh," }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: `(${report.dibuat_oleh_nama || "........................."})` }),
              new Paragraph({ text: report.dibuat_oleh_jabatan || "Owner Superintendent" }),
              report.ditandatangani_os_at
                ? new Paragraph({ children: [new TextRun({ text: `Ditandatangani: ${new Date(report.ditandatangani_os_at).toLocaleString("id-ID")}`, size: 16, italics: true })] })
                : new Paragraph({ text: "" }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ text: "Diketahui Oleh," }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: `(${report.diketahui_oleh_nama || "........................."})` }),
              new Paragraph({ text: report.diketahui_oleh_jabatan || "Operation Manager" }),
              report.ditandatangani_om_at
                ? new Paragraph({ children: [new TextRun({ text: `Ditandatangani: ${new Date(report.ditandatangani_om_at).toLocaleString("id-ID")}`, size: 16, italics: true })] })
                : new Paragraph({ text: "" }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "LAPORAN HARIAN DOCKING", bold: true, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "FM.TB.414", size: 20, color: "666666" })],
          }),
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
