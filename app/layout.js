import "./globals.css";

export const metadata = {
  title: "Laporan Harian Docking - FM.TB.414",
  description: "Aplikasi pengisian Laporan Harian Docking untuk OS/DS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-100 min-h-screen text-slate-800">
        {children}
      </body>
    </html>
  );
}
